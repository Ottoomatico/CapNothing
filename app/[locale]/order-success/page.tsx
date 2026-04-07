import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ClearCartOnMount from '@/components/cart/ClearCartOnMount'

export default async function OrderSuccessPage() {
  const t = await getTranslations('success')
  const locale = await getLocale()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: '#060606' }}>
      <ClearCartOnMount />
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ border: '1px solid #E8E8E8' }}
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E8E8E8' }} />
      </div>
      <p className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.5em', color: '#666666' }}>{t('title')}</p>
      <p className="font-mono text-[10px]" style={{ letterSpacing: '0.2em', color: '#E8E8E8' }}>{t('subtitle')}</p>
      <Link href={`/${locale}/account/orders`}>
        <Button variant="ghost">{t('cta')}</Button>
      </Link>
    </div>
  )
}
