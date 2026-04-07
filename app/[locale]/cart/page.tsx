'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const { items, removeItem, updateQuantity, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#060606' }}>
        <p className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.4em', color: '#666666' }}>{t('empty')}</p>
        <Link href={`/${locale}/products`}>
          <Button variant="ghost">← PRODUITS</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16" style={{ backgroundColor: '#060606' }}>
      <p className="font-mono text-[9px] uppercase mb-12" style={{ letterSpacing: '0.4em', color: '#666666' }}>{t('title')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Items */}
        <div className="lg:col-span-2" style={{ borderTop: '1px solid #2A2A2A' }}>
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between py-6"
              style={{ borderBottom: '1px solid #2A2A2A' }}
            >
              <div>
                <p className="font-mono text-[10px] uppercase" style={{ letterSpacing: '0.2em', color: '#E8E8E8' }}>{item.name}</p>
                <p className="font-mono text-[9px] mt-1" style={{ letterSpacing: '0.1em', color: '#666666' }}>
                  {formatPrice(item.price, locale)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="font-mono w-6 h-6 flex items-center justify-center transition-colors"
                    style={{ color: '#666666', border: '1px solid #2A2A2A', background: 'none', cursor: 'pointer' }}
                  >−</button>
                  <span className="font-mono text-[10px] w-4 text-center" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="font-mono w-6 h-6 flex items-center justify-center transition-colors"
                    style={{ color: '#666666', border: '1px solid #2A2A2A', background: 'none', cursor: 'pointer' }}
                  >+</button>
                </div>
                <span className="font-mono text-[10px] w-16 text-right" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>
                  {formatPrice(item.price * item.quantity, locale)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="font-mono text-[8px] ml-2 transition-colors"
                  style={{ color: '#666666', background: 'none', border: 'none', cursor: 'pointer' }}
                >×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="p-6 space-y-6" style={{ border: '1px solid #2A2A2A' }}>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.3em', color: '#666666' }}>{t('total')}</span>
              <span className="font-mono text-lg" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>
                {formatPrice(total(), locale)}
              </span>
            </div>
            <Link href={`/${locale}/checkout`}>
              <Button className="w-full justify-center">{t('checkout')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
