'use client'

import dynamic from 'next/dynamic'

const ProductViewer = dynamic(() => import('./ProductViewer'), { ssr: false })

export default function ProductViewerClient({ rotateLabel }: { rotateLabel: string }) {
  return <ProductViewer rotateLabel={rotateLabel} />
}
