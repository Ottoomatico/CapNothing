'use server'

import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  slug: string
}

export async function createCheckoutSession(items: CartItem[], locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.name },
      },
      quantity: item.quantity,
    })),
    metadata: {
      user_id: user.id,
      items: JSON.stringify(items.map(i => ({
        id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      }))),
    },
    success_url: `${baseUrl}/${locale}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/${locale}/cart`,
  })

  redirect(session.url!)
}
