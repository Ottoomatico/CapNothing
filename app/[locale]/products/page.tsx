import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'

export default async function ProductsPage() {
  const locale = await getLocale()
  const t = await getTranslations('products')
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  const translations = {
    inStock: t('inStock'),
    outOfStock: t('outOfStock'),
  }

  return (
    <div className="pt-24 pb-16" style={{ backgroundColor: '#060606' }}>
      <div className="px-8 md:px-16 mb-16">
        <p className="font-mono text-[9px] uppercase mb-3" style={{ letterSpacing: '0.4em', color: '#666666' }}>
          {t('subtitle')}
        </p>
        <h1 className="font-sans font-light" style={{ fontSize: '2.5rem', letterSpacing: '0.2em', color: '#E8E8E8' }}>
          {t('title')}
        </h1>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-8 md:mx-16"
        style={{ gap: '1px', backgroundColor: '#2A2A2A' }}
      >
        {products?.map(product => (
          <ProductCard key={product.id} product={product} locale={locale} t={translations} />
        ))}
      </div>
    </div>
  )
}
