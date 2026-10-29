import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'linenluxe.cart.v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function CartProvider({ children }) {
  // items: { [serviceId]: { id, slug, name, unit, unit_price, image_path, quantity } }
  const [items, setItems] = useState(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore storage errors */
    }
  }, [items])

  const addItem = useCallback((service, qty = 1) => {
    setItems((prev) => {
      const existing = prev[service.id]
      const quantity = (existing?.quantity ?? 0) + qty
      if (quantity <= 0) {
        const next = { ...prev }
        delete next[service.id]
        return next
      }
      return {
        ...prev,
        [service.id]: {
          id: service.id,
          slug: service.slug,
          name: service.name,
          unit: service.unit,
          unit_price: Number(service.base_price) || 0,
          image_path: service.image_path,
          quantity,
        },
      }
    })
  }, [])

  const setQty = useCallback((serviceId, quantity) => {
    setItems((prev) => {
      if (!prev[serviceId]) return prev
      if (quantity <= 0) {
        const next = { ...prev }
        delete next[serviceId]
        return next
      }
      return { ...prev, [serviceId]: { ...prev[serviceId], quantity } }
    })
  }, [])

  const removeItem = useCallback((serviceId) => {
    setItems((prev) => {
      const next = { ...prev }
      delete next[serviceId]
      return next
    })
  }, [])

  const clearCart = useCallback(() => setItems({}), [])

  const list = useMemo(() => Object.values(items), [items])
  const count = useMemo(() => list.reduce((s, i) => s + i.quantity, 0), [list])
  const subtotal = useMemo(
    () => list.reduce((s, i) => s + i.unit_price * i.quantity, 0),
    [list],
  )

  const value = {
    items,
    list,
    count,
    subtotal,
    addItem,
    setQty,
    removeItem,
    clearCart,
    getQty: (id) => items[id]?.quantity ?? 0,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
