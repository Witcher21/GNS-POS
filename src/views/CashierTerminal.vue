<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- Search Row -->
    <ProductSearchBar @product-selected="onProductSelected" ref="searchBar" />

    <div class="flex flex-1 gap-4 overflow-hidden">
      <!-- Cart Area -->
      <div class="flex-1 card flex flex-col overflow-hidden">
        <div class="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 class="font-semibold text-slate-200" :class="{ si: locale === 'si' }">
            🛒 {{ t('cashier.cart') }}
            <span class="text-slate-500 text-sm ml-2">({{ cart.itemCount }} {{ t('cashier.qty') }})</span>
          </h2>
          <button v-if="cart.items.length" @click="cart.clearCart()" class="text-red-400 hover:text-red-300 text-sm hover:bg-red-500/10 px-2 py-1 rounded-lg transition-all"
            :class="{ si: locale === 'si' }">{{ t('cashier.clearCart') }}</button>
        </div>
        <CartTable class="flex-1" />
      </div>

      <!-- Order Panel -->
      <div class="w-64 flex flex-col gap-3">
        <!-- Totals -->
        <div class="card">
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm text-slate-400">
              <span :class="{ si: locale === 'si' }">{{ t('cashier.subtotal') }}</span>
              <span class="text-white">Rs. {{ cart.total.toFixed(2) }}</span>
            </div>
          </div>
          <div class="flex justify-between items-center border-t border-slate-700 pt-3">
            <span class="text-base font-bold" :class="{ si: locale === 'si' }">{{ t('cashier.grandTotal') }}</span>
            <span class="text-2xl font-bold text-emerald-400">Rs. {{ cart.total.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Checkout Button -->
        <button @click="showCheckout = true" :disabled="!cart.items.length"
          class="btn-primary justify-center py-4 text-base w-full">
          <span>💳</span>
          <span :class="{ si: locale === 'si' }">{{ t('cashier.checkout') }}</span>
        </button>

        <!-- Last toast -->
        <div v-if="lastAdded" class="badge-green w-full text-center py-1.5 rounded-lg transition-all" :class="{ si: locale === 'si' }">
          ✔ {{ lastAdded }}
        </div>
      </div>
    </div>

    <CheckoutModal v-if="showCheckout" @close="showCheckout = false" @confirmed="onCheckoutDone" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart'
import ProductSearchBar from '../components/ProductSearchBar.vue'
import CartTable from '../components/CartTable.vue'
import CheckoutModal from '../components/CheckoutModal.vue'

const { t, locale } = useI18n()
const cart = useCartStore()
const showCheckout = ref(false)
const searchBar    = ref(null)
const lastAdded    = ref('')
let lastAddedTimer

function onProductSelected(product) {
  const result = cart.addItem(product)
  if (!result.added) {
    window.$toast?.({ type: 'warning', title: t('cashier.stockAlert'), message: product.name_en })
    return
  }
  showLastAdded(locale.value === 'si' ? product.name_si || product.name_en : product.name_en)
}

function showLastAdded(name) {
  lastAdded.value = name
  clearTimeout(lastAddedTimer)
  lastAddedTimer = setTimeout(() => lastAdded.value = '', 2000)
}

function onCheckoutDone() {
  showCheckout.value = false
  searchBar.value?.focus()
}
</script>
