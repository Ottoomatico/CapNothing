import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as {
    id: string
    amount_total: number | null
    metadata: { user_id?: string; items?: string } | null
  }

  const userId = session.metadata?.user_id
  const items: Array<{ id: string; quantity: number; unit_price: number }> =
    JSON.parse(session.metadata?.items || '[]')

  if (!userId || !items.length) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      status: 'paid',
      total: (session.amount_total ?? 0) / 100,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order insert error:', orderError)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  // Insert order items
  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    console.error('Order items insert error:', itemsError)
    return NextResponse.json({ error: 'Order items creation failed' }, { status: 500 })
  }

  // Decrement stock atomically via RPC
  for (const item of items) {
    await supabase.rpc('decrement_stock', {
      product_id: item.id,
      qty: item.quantity,
    })
  }

  return NextResponse.json({ received: true })
}
