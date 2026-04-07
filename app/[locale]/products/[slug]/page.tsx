import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import AddToCartButton from '@/components/products/AddToCartButton'
import ProductViewer from '@/components/three/ProductViewerClient'

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('products')
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!product) notFound()

  const name = locale === 'fr' ? product.name_fr : product.name_en
  const description = locale === 'fr' ? product.description_fr : product.description_en

  return (
    <div className="min-h-screen pt-20 grid grid-cols-1 lg:grid-cols-2" style={{ backgroundColor: '#060606' }}>
      {/* 3D Viewer */}
      <div className="relative h-[60vh] lg:h-screen lg:sticky lg:top-0" style={{ backgroundColor: '#060606' }}>
        <ProductViewer rotateLabel={t('rotate')} />
      </div>

      {/* Product info */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-16">
        <div className="font-mono text-[8px] uppercase mb-2" style={{ letterSpacing: '0.4em', color: '#666666' }}>
          {product.category?.toUpperCase()}
        </div>

        <h1 className="font-sans font-light mb-6" style={{ fontSize: '2.25rem', letterSpacing: '0.15em', color: '#E8E8E8' }}>
          {name.toUpperCase()}
        </h1>

        <div className="flex gap-2 mb-8">
          <Badge>60 {t('capsules')}</Badge>
          <Badge>30 {t('days')}</Badge>
          <Badge active={product.stock > 0}>
            {product.stock > 0 ? t('inStock') : t('outOfStock')}
          </Badge>
        </div>

        <p className="font-mono text-[11px] leading-relaxed mb-10 max-w-sm" style={{ letterSpacing: '0.1em', color: '#666666' }}>
          {description}
        </p>

        <div className="font-mono text-2xl mb-8" style={{ letterSpacing: '0.15em', color: '#E8E8E8' }}>
          {formatPrice(product.price, locale)}
        </div>

        <div className="flex flex-col gap-3 max-w-xs">
          <AddToCartButton product={product} locale={locale} />
        </div>
      </div>
    </div>
  )
}
