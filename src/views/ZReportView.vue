<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- Controls -->
    <div class="flex items-center gap-3 flex-shrink-0">
      <input v-model="selectedDate" type="date" class="input-field w-44" />
      <button @click="generate" :disabled="loading" class="btn-primary">
        <span v-if="loading" class="animate-spin">⏳</span>
        <span :class="{ si: locale === 'si' }">{{ t('zreport.generate') }}</span>
      </button>
    </div>

    <div v-if="!report" class="flex-1 flex items-center justify-center text-slate-500" :class="{ si: locale === 'si' }">
      {{ t('zreport.noData') }}
    </div>

    <div v-else class="flex-1 overflow-auto space-y-4">
      <!-- Stat Cards -->
      <div class="grid grid-cols-4 gap-4 flex-shrink-0">
        <div class="stat-card">
          <div class="text-2xl">💰</div>
          <div class="stat-value text-emerald-400">Rs. {{ parseFloat(report.summary.total_sales || 0).toFixed(2) }}</div>
          <div class="stat-label" :class="{ si: locale === 'si' }">{{ t('zreport.totalSales') }}</div>
        </div>
        <div class="stat-card">
          <div class="text-2xl">🧾</div>
          <div class="stat-value">{{ report.summary.invoice_count || 0 }}</div>
          <div class="stat-label" :class="{ si: locale === 'si' }">{{ t('zreport.invoiceCount') }}</div>
        </div>
        <div class="stat-card">
          <div class="text-2xl">💵</div>
          <div class="stat-value text-blue-400">Rs. {{ parseFloat(report.summary.total_cash || 0).toFixed(2) }}</div>
          <div class="stat-label" :class="{ si: locale === 'si' }">{{ t('zreport.totalCash') }}</div>
        </div>
        <div class="stat-card">
          <div class="text-2xl">💳</div>
          <div class="stat-value text-purple-400">Rs. {{ parseFloat(report.summary.total_card || 0).toFixed(2) }}</div>
          <div class="stat-label" :class="{ si: locale === 'si' }">{{ t('zreport.totalCard') }}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Top Products -->
        <div class="card">
          <h3 class="font-semibold text-slate-200 mb-3" :class="{ si: locale === 'si' }">{{ t('zreport.topProducts') }}</h3>
          <div v-if="!report.topProducts.length" class="text-slate-500 text-sm text-center py-4" :class="{ si: locale === 'si' }">{{ t('common.noData') }}</div>
          <table v-else class="w-full text-sm">
            <thead><tr>
              <th class="table-header py-1.5 text-left">#</th>
              <th class="table-header py-1.5 text-left" :class="{ si: locale === 'si' }">{{ t('zreport.product') }}</th>
              <th class="table-header py-1.5 text-right" :class="{ si: locale === 'si' }">{{ t('zreport.qtySold') }}</th>
              <th class="table-header py-1.5 text-right" :class="{ si: locale === 'si' }">{{ t('zreport.revenue') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="(p, i) in report.topProducts" :key="i" class="border-t border-slate-700/40">
                <td class="py-2 text-slate-500 text-xs">{{ i + 1 }}</td>
                <td class="py-2 text-white" :class="locale === 'si' ? 'si' : ''">
                  {{ locale === 'si' ? p.product_name_si || p.product_name_en : p.product_name_en }}
                </td>
                <td class="py-2 text-right text-slate-300">{{ p.total_qty }}</td>
                <td class="py-2 text-right text-emerald-400 font-medium">Rs. {{ parseFloat(p.total_revenue).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Hourly -->
        <div class="card">
          <h3 class="font-semibold text-slate-200 mb-3" :class="{ si: locale === 'si' }">{{ t('zreport.hourlySales') }}</h3>
          <div v-if="!report.hourly.length" class="text-slate-500 text-sm text-center py-4" :class="{ si: locale === 'si' }">{{ t('common.noData') }}</div>
          <div v-else class="space-y-2">
            <div v-for="h in report.hourly" :key="h.hour" class="flex items-center gap-3">
              <span class="text-slate-400 text-xs w-12 flex-shrink-0">{{ h.hour }}</span>
              <div class="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full transition-all" :style="{ width: barWidth(h.total) }"></div>
              </div>
              <span class="text-white text-xs w-28 text-right flex-shrink-0">Rs. {{ parseFloat(h.total).toFixed(0) }} ({{ h.count }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const report = ref(null)
const loading = ref(false)

async function generate() {
  loading.value = true
  const res = await window.api.getZReport(selectedDate.value)
  if (res.success) report.value = res.data
  else window.$toast?.({ type: 'error', title: t('common.error'), message: res.error })
  loading.value = false
}

function barWidth(val) {
  if (!report.value?.hourly?.length) return '0%'
  const max = Math.max(...report.value.hourly.map(h => h.total))
  return max > 0 ? `${(val / max * 100).toFixed(1)}%` : '0%'
}
</script>
