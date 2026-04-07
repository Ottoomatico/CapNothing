import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  slug: string
  name_fr: string
  name_en: string
  description_fr: string | null
  description_en: string | null
  price: number
  stock: number
  category: string | null
}

interface ProductCardProps {
  product: Product
  locale: string
  t: {
    inStock: string
    outOfStock: string
  }
}

export default function ProductCard({ product, locale, t }: ProductCardProps) {
  const name = locale === 'fr' ? product.name_fr : product.name_en
  const description = locale === 'fr' ? product.description_fr : product.description_en
  const inStock = product.stock > 0

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group block p-8 transition-colors"
      style={{ backgroundColor: '#060606' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111111')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#060606')}
    >
      {/* Mini capsule visuelle */}
      <div className="flex justify-center mb-10">
        <div
          className="w-10 h-16 rounded-full transition-colors"
          style={{ background: 'linear-gradient(180deg, #1A1A1A, #111111)', border: '1px solid #2A2A2A' }}
        />
      </div>

      <div className="space-y-3">
        {product.category && (
          <Badge>{product.category.toUpperCase()}</Badge>
        )}
        <h3 className="font-sans font-light mt-2" style={{ fontSize: '18px', letterSpacing: '0.15em', color: '#E8E8E8' }}>
          {name.toUpperCase()}
        </h3>
        {description && (
          <p className="font-mono text-[10px] leading-relaxed" style={{ letterSpacing: '0.1em', color: '#666666', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}
        <div className="flex items-center justify-between pt-4">
          <span className="font-mono text-sm" style={{ letterSpacing: '0.15em', color: '#E8E8E8' }}>
            {formatPrice(product.price, locale)}
          </span>
          <Badge active={inStock}>
            {inStock ? t.inStock : t.outOfStock}
          </Badge>
        </div>
      </div>
    </Link>
  )
}
