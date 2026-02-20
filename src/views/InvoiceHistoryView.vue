<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- Invoice List -->
    <div class="flex-1 card overflow-auto">
      <div v-if="loading" class="flex items-center justify-center h-32 text-slate-500">{{ t('common.loading') }}</div>
      <div v-else-if="!data.invoices?.length" class="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
        <span class="text-3xl">🧾</span>
        <p :class="{ si: locale === 'si' }">{{ t('invoices.noInvoices') }}</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="sticky top-0 bg-slate-800">
          <tr>
            <th class="table-header px-4 py-2.5 text-left">{{ t('invoices.id') }}</th>
            <th class="table-header px-4 py-2.5 text-left">{{ t('invoices.date') }}</th>
            <th class="table-header px-4 py-2.5 text-right">{{ t('invoices.total') }}</th>
            <th class="table-header px-4 py-2.5 text-center">{{ t('invoices.payMethod') }}</th>
            <th class="table-header px-4 py-2.5 text-center">{{ t('invoices.phone') }}</th>
            <th class="table-header px-4 py-2.5 text-center">{{ t('invoices.actions', 'Actions') || 'Actions' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in data.invoices" :key="inv.id" class="border-t border-slate-700/40 hover:bg-slate-700/20 cursor-pointer transition-colors" @click="viewDetail(inv.id)">
            <td class="px-4 py-3 text-emerald-400 font-bold">#{{ inv.id }}</td>
            <td class="px-4 py-3 text-slate-300 text-xs">{{ fmtDate(inv.created_at) }}</td>
            <td class="px-4 py-3 text-right font-semibold text-white">Rs. {{ parseFloat(inv.total).toFixed(2) }}</td>
            <td class="px-4 py-3 text-center">
              <span v-if="inv.cash_paid > 0 && inv.card_paid > 0" class="badge-blue">Split</span>
              <span v-else-if="inv.card_paid > 0" class="badge-blue">💳 Card</span>
              <span v-else class="badge-green">💵 Cash</span>
            </td>
            <td class="px-4 py-3 text-center text-slate-400 text-xs">{{ inv.customer_phone || '—' }}</td>
            <td class="px-4 py-3 text-center">
              <div class="flex gap-2 justify-center" @click.stop>
                <button @click="viewDetail(inv.id)" class="btn-ghost py-1 px-2 text-xs text-blue-400">👁 {{ t('invoices.view') }}</button>
                <button @click="reprintPDF(inv.id)" class="btn-ghost py-1 px-2 text-xs text-slate-400">🖨 {{ t('invoices.pdf') }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="data.pages > 1" class="flex justify-center gap-2 flex-shrink-0">
      <button v-for="p in data.pages" :key="p" @click="loadPage(p)"
        :class="p === currentPage ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
        class="w-9 h-9 rounded-lg text-sm font-medium transition-all">{{ p }}</button>
    </div>

    <!-- Detail Modal -->
    <teleport to="body" v-if="detail">
      <div class="modal-overlay" @click.self="detail = null">
        <div class="modal-box max-w-lg">
          <div class="modal-header">
            <h2 class="text-lg font-bold text-white">{{ t('invoices.detail') }} #{{ detail.id }}</h2>
            <button @click="detail = null" class="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700">✕</button>
          </div>
          <div class="p-5 space-y-3">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-slate-400">Date:</span> <span class="text-white">{{ fmtDate(detail.created_at) }}</span></div>
              <div><span class="text-slate-400">Phone:</span> <span class="text-white">{{ detail.customer_phone || '—' }}</span></div>
              <div><span class="text-slate-400">Cash:</span> <span class="text-white">Rs. {{ parseFloat(detail.cash_paid || 0).toFixed(2) }}</span></div>
              <div><span class="text-slate-400">Card:</span> <span class="text-white">Rs. {{ parseFloat(detail.card_paid || 0).toFixed(2) }}</span></div>
            </div>
            <table class="w-full text-sm border-t border-slate-700 pt-2">
              <thead><tr>
                <th class="table-header py-2 text-left">Item</th>
                <th class="table-header py-2 text-center">Qty</th>
                <th class="table-header py-2 text-right">Unit</th>
                <th class="table-header py-2 text-right">Total</th>
              </tr></thead>
              <tbody>
                <tr v-for="item in detail.items" :key="item.id" class="border-t border-slate-700/40">
                  <td class="py-2 text-white">{{ item.product_name_en }}</td>
                  <td class="py-2 text-center text-slate-300">{{ item.qty }}</td>
                  <td class="py-2 text-right text-slate-300">Rs. {{ parseFloat(item.unit_price).toFixed(2) }}</td>
                  <td class="py-2 text-right font-semibold text-emerald-400">Rs. {{ parseFloat(item.line_total).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-between text-base font-bold border-t border-slate-600 pt-3">
              <span>Total</span><span class="text-emerald-400">Rs. {{ parseFloat(detail.total).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const data = ref({ invoices: [], total: 0, pages: 1 })
const loading = ref(false)
const currentPage = ref(1)
const detail = ref(null)

async function loadPage(p = 1) {
  loading.value = true; currentPage.value = p
  const res = await window.api.getInvoices({ page: p, limit: 25 })
  if (res.success) data.value = res.data
  loading.value = false
}

async function viewDetail(id) {
  const res = await window.api.getInvoiceDetail(id)
  if (res.success) detail.value = res.data
}

async function reprintPDF(id) {
  const res = await window.api.getInvoiceDetail(id)
  if (res.success) {
    const inv = res.data
    await window.api.printReceipt({ invoiceId: inv.id, items: inv.items, total: inv.total, subtotal: inv.subtotal, cashPaid: inv.cash_paid, cardPaid: inv.card_paid, change: inv.change_given, customerPhone: inv.customer_phone, createdAt: inv.created_at })
    window.$toast?.({ type: 'info', title: 'PDF opened' })
  }
}

function fmtDate(str) {
  return new Date(str).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })
}
onMounted(loadPage)
</script>
