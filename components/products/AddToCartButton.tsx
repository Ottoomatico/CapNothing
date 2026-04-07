'use client'

import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import Button from '@/components/ui/Button'

interface Props {
  product: {
    id: string
    slug: string
    name_fr: string
    name_en: string
    price: number
    stock: number
  }
  locale: string
}

export default function AddToCartButton({ product, locale }: Props) {
  const t = useTranslations('products')
  const addItem = useCartStore(s => s.addItem)

  function handleAdd() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: locale === 'fr' ? product.name_fr : product.name_en,
      price: product.price,
      quantity: 1,
    })
  }

  return (
    <Button
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="w-full justify-center"
    >
      {t('addToCart')}
    </Button>
  )
}
