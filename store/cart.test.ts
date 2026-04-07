import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/store/cart'

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('cart store', () => {
  it('adds an item', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('increments quantity when same item added', () => {
    const item = { id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' }
    useCartStore.getState().addItem(item)
    useCartStore.getState().addItem(item)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('removes an item', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' })
    useCartStore.getState().removeItem('p1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears the cart', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 1, slug: 'energie-pure' })
    useCartStore.getState().addItem({ id: 'p2', name: 'Focus', price: 54, quantity: 1, slug: 'focus-cognitif' })
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('computes total correctly', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Énergie', price: 49, quantity: 2, slug: 'energie-pure' })
    useCartStore.getState().addItem({ id: 'p2', name: 'Focus', price: 54, quantity: 1, slug: 'focus-cognitif' })
    expect(useCartStore.getState().total()).toBe(152)
  })
})
