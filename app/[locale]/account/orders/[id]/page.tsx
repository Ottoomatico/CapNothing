import { notFound, redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('account')

  if (!user) redirect(`/${locale}/login`)

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, total, created_at,
      order_items (
        quantity, unit_price,
        products ( name_fr, name_en, slug )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16" style={{ backgroundColor: '#060606' }}>
      <div className="flex items-center gap-4 mb-12">
        <p className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.4em', color: '#666666' }}>
          {t('orderNumber')} #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <Badge active={order.status === 'delivered'}>
          {t(`status.${order.status}` as any)}
        </Badge>
      </div>

      <div className="max-w-md" style={{ borderTop: '1px solid #2A2A2A' }}>
        {(order.order_items as any[])?.map((item, i) => {
          const name = locale === 'fr' ? item.products?.name_fr : item.products?.name_en
          return (
            <div key={i} className="flex justify-between items-center py-4" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <div>
                <p className="font-mono text-[10px] uppercase" style={{ letterSpacing: '0.2em', color: '#E8E8E8' }}>{name}</p>
                <p className="font-mono text-[8px] mt-1" style={{ letterSpacing: '0.2em', color: '#666666' }}>× {item.quantity}</p>
              </div>
              <p className="font-mono text-[10px]" style={{ letterSpacing: '0.1em', color: '#666666' }}>
                {formatPrice(item.unit_price * item.quantity, locale)}
              </p>
            </div>
          )
        })}
        <div className="flex justify-between items-center py-4">
          <span className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.3em', color: '#666666' }}>TOTAL</span>
          <span className="font-mono text-lg" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>{formatPrice(order.total, locale)}</span>
        </div>
      </div>
    </div>
  )
}
