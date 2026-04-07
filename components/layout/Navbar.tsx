'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const itemCount = useCartStore(s => s.items.reduce((acc, i) => acc + i.quantity, 0))

  function switchLocale() {
    const next = locale === 'fr' ? 'en' : 'fr'
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(42,42,42,0.5)', backgroundColor: 'rgba(6,6,6,0.8)', backdropFilter: 'blur(8px)' }}>
      <Link href={`/${locale}`} className="font-mono text-[11px] uppercase" style={{ letterSpacing: '0.5em', color: '#E8E8E8' }}>
        CAPSULE
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link href={`/${locale}/products`} className="font-mono text-[9px] uppercase transition-colors" style={{ letterSpacing: '0.25em', color: '#666666' }}>
          {t('products')}
        </Link>
        <Link href={`/${locale}/about`} className="font-mono text-[9px] uppercase transition-colors" style={{ letterSpacing: '0.25em', color: '#666666' }}>
          {t('about')}
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={switchLocale}
          className="font-mono text-[9px] uppercase transition-colors"
          style={{ letterSpacing: '0.2em', color: '#666666', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {locale === 'fr' ? 'FR · EN' : 'EN · FR'}
        </button>
        <Link href={`/${locale}/account`} className="font-mono text-[9px] transition-colors" style={{ color: '#666666' }}>
          ○
        </Link>
        <Link href={`/${locale}/cart`} className="font-mono text-[9px] transition-colors relative" style={{ color: '#666666' }}>
          ⊙{itemCount > 0 && (
            <span className="absolute -top-2 -right-2 font-mono" style={{ fontSize: '8px', color: '#E8E8E8' }}>{itemCount}</span>
          )}
        </Link>
      </div>
    </nav>
  )
}
