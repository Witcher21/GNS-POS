import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.qty * i.selling_price, 0)
  )
  const itemCount = computed(() => items.value.reduce((s, i) => s + i.qty, 0))

  function addItem(product) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      if (existing.qty < product.stock) existing.qty++
      return { added: true, alreadyIn: true }
    }
    if (product.stock <= 0) return { added: false, error: 'noStock' }
    items.value.push({ ...product, qty: 1 })
    return { added: true }
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.id !== productId)
  }

  function updateQty(productId, qty) {
    const item = items.value.find(i => i.id === productId)
    if (!item) return
    if (qty <= 0) { removeItem(productId); return }
    if (qty > item.stock) return
    item.qty = qty
  }

  function clearCart() { items.value = [] }

  return { items, total, itemCount, addItem, removeItem, updateQty, clearCart }
})
