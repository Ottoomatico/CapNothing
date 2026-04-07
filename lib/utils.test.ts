import { describe, it, expect } from 'vitest'
import { formatPrice, cn } from '@/lib/utils'

describe('formatPrice', () => {
  it('formats EUR in French locale', () => {
    const result = formatPrice(49, 'fr')
    expect(result).toContain('49')
    expect(result).toContain('€')
  })

  it('formats EUR in English locale', () => {
    const result = formatPrice(49, 'en')
    expect(result).toContain('49')
    expect(result).toContain('€')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
