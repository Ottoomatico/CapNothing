'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { createCheckoutSession } from '@/actions/checkout'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const { items, total } = useCartStore()
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    await createCheckoutSession(items, locale)
  }

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16" style={{ backgroundColor: '#060606' }}>
      <p className="font-mono text-[9px] uppercase mb-12" style={{ letterSpacing: '0.4em', color: '#666666' }}>RÉCAPITULATIF</p>

      <div className="max-w-md mb-12" style={{ borderTop: '1px solid #2A2A2A' }}>
        {items.map(item => (
          <div
            key={item.id}
            className="flex justify-between items-center py-4"
            style={{ borderBottom: '1px solid #2A2A2A' }}
          >
            <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: '0.2em', color: '#E8E8E8' }}>
              {item.name} × {item.quantity}
            </span>
            <span className="font-mono text-[10px]" style={{ letterSpacing: '0.1em', color: '#666666' }}>
              {formatPrice(item.price * item.quantity, locale)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center py-4">
          <span className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.3em', color: '#666666' }}>{t('total')}</span>
          <span className="font-mono text-lg" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>{formatPrice(total(), locale)}</span>
        </div>
      </div>

      <Button onClick={handleCheckout} disabled={loading || items.length === 0}>
        {loading ? '...' : `PAYER ${formatPrice(total(), locale)} →`}
      </Button>
    </div>
  )
}
