<template>
  <div class="flex-1 overflow-auto">
    <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-48 text-slate-500">
      <span class="text-4xl mb-3">🛒</span>
      <p :class="{ si: locale === 'si' }" class="text-sm">{{ t('cashier.emptyCart') }}</p>
    </div>
    <table v-else class="w-full text-sm">
      <thead class="sticky top-0 bg-slate-900 z-10">
        <tr class="text-left">
          <th class="table-header px-3 py-2">#</th>
          <th class="table-header px-3 py-2" :class="{ si: locale === 'si' }">{{ t('cashier.product') }}</th>
          <th class="table-header px-3 py-2 text-right">{{ t('cashier.price') }}</th>
          <th class="table-header px-3 py-2 text-center">{{ t('cashier.qty') }}</th>
          <th class="table-header px-3 py-2 text-right">{{ t('cashier.total') }}</th>
          <th class="table-header px-3 py-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in cart.items" :key="item.id"
          class="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
          <td class="px-3 py-2.5 text-slate-500 text-xs">{{ idx + 1 }}</td>
          <td class="px-3 py-2.5">
            <div class="font-medium text-white" :class="{ si: locale === 'si' }">
              {{ locale === 'si' ? item.name_si || item.name_en : item.name_en }}
            </div>
            <div v-if="item.barcode" class="text-slate-500 text-xs">{{ item.barcode }}</div>
          </td>
          <td class="px-3 py-2.5 text-right text-slate-300">Rs. {{ item.selling_price.toFixed(2) }}</td>
          <td class="px-3 py-2.5">
            <div class="flex items-center gap-1 justify-center">
              <button @click="cart.updateQty(item.id, item.qty - 1)"
                class="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold transition-colors">−</button>
              <input type="number" :value="item.qty" min="1" :max="item.stock"
                @change="e => cart.updateQty(item.id, parseInt(e.target.value))"
                class="w-12 text-center bg-slate-800 border border-slate-600 rounded-md text-white text-sm py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <button @click="cart.updateQty(item.id, item.qty + 1)"
                class="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold transition-colors">+</button>
            </div>
          </td>
          <td class="px-3 py-2.5 text-right font-semibold text-emerald-400">
            Rs. {{ (item.qty * item.selling_price).toFixed(2) }}
          </td>
          <td class="px-3 py-2.5">
            <button @click="cart.removeItem(item.id)"
              class="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-7 h-7 rounded-md flex items-center justify-center transition-all">🗑</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart'
const { t, locale } = useI18n()
const cart = useCartStore()
</script>
