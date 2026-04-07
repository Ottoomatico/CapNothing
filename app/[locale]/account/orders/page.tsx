import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('account')

  if (!user) redirect(`/${locale}/login`)

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, total, created_at,
      order_items (
        quantity,
        products ( name_fr, name_en )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16" style={{ backgroundColor: '#060606' }}>
      <p className="font-mono text-[9px] uppercase mb-12" style={{ letterSpacing: '0.4em', color: '#666666' }}>{t('orders')}</p>

      {!orders?.length ? (
        <p className="font-mono text-[10px]" style={{ letterSpacing: '0.2em', color: '#666666' }}>{t('noOrders')}</p>
      ) : (
        <div className="max-w-2xl" style={{ borderTop: '1px solid #2A2A2A' }}>
          {orders.map((order: any) => (
            <Link
              key={order.id}
              href={`/${locale}/account/orders/${order.id}`}
              className="block py-6 transition-colors"
              style={{ borderBottom: '1px solid #2A2A2A' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-[9px] uppercase mb-1" style={{ letterSpacing: '0.3em', color: '#666666' }}>
                    {t('orderNumber')} #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="font-mono text-[10px]" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>
                    {order.order_items?.map((item: any) => {
                      const name = locale === 'fr' ? item.products?.name_fr : item.products?.name_en
                      return `${name} × ${item.quantity}`
                    }).join(' · ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[11px] mb-2" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>
                    {formatPrice(order.total, locale)}
                  </p>
                  <Badge active={order.status === 'delivered'}>
                    {t(`status.${order.status}` as any)}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
