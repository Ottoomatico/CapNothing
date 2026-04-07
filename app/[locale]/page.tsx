import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import HeroScene from '@/components/three/HeroSceneClient'

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getTranslations('home')
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name_fr, name_en, price, category')
    .eq('active', true)
    .limit(3)

  return (
    <>
      {/* Hero — full screen, model fused with void */}
      <section className="relative h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#060606' }}>
        <HeroScene />

        {/* Text over the 3D canvas */}
        <div className="relative z-10 px-8 md:px-16 max-w-lg">
          <p className="font-mono text-[9px] uppercase mb-6" style={{ letterSpacing: '0.4em', color: '#666666' }}>
            {t('tagline')}
          </p>
          <h1 className="font-sans font-light text-ice leading-tight whitespace-pre-line" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', letterSpacing: '0.1em', color: '#E8E8E8' }}>
            {t('headline')}
          </h1>
          <p className="font-mono text-[10px] mt-8 leading-relaxed whitespace-pre-line" style={{ letterSpacing: '0.2em', color: '#666666' }}>
            {t('sub')}
          </p>
          <Link href={`/${locale}/products`} className="inline-block mt-10">
            <Button>{t('cta')}</Button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #2A2A2A, transparent)' }} />
          <span className="font-mono text-[7px] uppercase" style={{ letterSpacing: '0.3em', color: '#333333' }}>SCROLL</span>
        </div>
      </section>

      {/* Featured products */}
      {products && products.length > 0 && (
        <section className="px-8 md:px-16 py-24" style={{ backgroundColor: '#060606' }}>
          <p className="font-mono text-[9px] uppercase mb-12" style={{ letterSpacing: '0.4em', color: '#666666' }}>
            {t('featured')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1px', backgroundColor: '#2A2A2A' }}>
            {products.map(product => (
              <Link
                key={product.id}
                href={`/${locale}/products/${product.slug}`}
                className="flex flex-col items-center justify-center p-12 transition-colors"
                style={{ backgroundColor: '#060606', minHeight: '200px' }}
              >
                <div className="w-8 h-14 rounded-full mb-6" style={{ background: 'linear-gradient(180deg, #1A1A1A, #0A0A0A)', border: '1px solid #2A2A2A' }} />
                <p className="font-mono text-[10px] uppercase" style={{ letterSpacing: '0.2em', color: '#E8E8E8' }}>
                  {locale === 'fr' ? product.name_fr : product.name_en}
                </p>
                <p className="font-mono text-[9px] mt-2" style={{ color: '#666666' }}>
                  {product.price}€
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
