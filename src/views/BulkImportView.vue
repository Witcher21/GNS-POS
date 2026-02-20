<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- Drop Zone -->
    <div class="card flex-shrink-0"
      @drop.prevent="onDrop" @dragover.prevent="dragging = true" @dragleave="dragging = false"
      :class="dragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-dashed border-slate-600'">
      <div class="flex flex-col items-center justify-center py-10 gap-3 cursor-pointer" @click="triggerFileInput">
        <span class="text-5xl">📂</span>
        <p class="text-slate-300 font-medium text-center" :class="{ si: locale === 'si' }">{{ t('import.dropZone') }}</p>
        <p class="text-slate-500 text-xs text-center max-w-lg">{{ t('import.format') }}</p>
        <button type="button" class="btn-secondary mt-2">
          <span>📁</span> <span :class="{ si: locale === 'si' }">{{ t('import.browse') }}</span>
        </button>
        <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="onFileSelect" />
      </div>
    </div>

    <!-- Actions Row -->
    <div class="flex items-center gap-3 flex-shrink-0">
      <button @click="downloadSample" class="btn-secondary text-sm">
        📥 <span :class="{ si: locale === 'si' }">{{ t('import.downloadSample') }}</span>
      </button>
      <button v-if="preview.length" @click="runImport" :disabled="importing" class="btn-primary text-sm">
        <span v-if="importing" class="animate-spin">⏳</span>
        <span :class="{ si: locale === 'si' }">{{ importing ? t('import.importing') : t('import.importBtn', { count: totalRows }) }}</span>
      </button>
      <p v-if="result" class="text-sm" :class="[result.success ? 'text-emerald-400' : 'text-red-400', { si: locale === 'si' }]">
        {{ result.success ? t('import.success', { count: result.count }) : t('import.error', { msg: result.error }) }}
      </p>
    </div>

    <!-- Preview Table -->
    <div v-if="preview.length" class="flex-1 card overflow-auto">
      <h3 class="font-semibold text-slate-200 mb-3" :class="{ si: locale === 'si' }">{{ t('import.preview') }}</h3>
      <table class="w-full text-sm">
        <thead><tr class="bg-slate-900">
          <th v-for="col in Object.keys(preview[0])" :key="col" class="table-header px-3 py-2 text-left">{{ col }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row, i) in preview" :key="i" class="border-t border-slate-700/40 hover:bg-slate-700/20">
            <td v-for="col in Object.keys(row)" :key="col" class="px-3 py-2 text-slate-300" :class="col === 'name_si' ? 'si' : ''">{{ row[col] || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-slate-500 text-xs mt-2">Showing first 10 of {{ totalRows }} rows</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const dragging   = ref(false)
const preview    = ref([])
const totalRows  = ref(0)
const fileInput  = ref(null)
const importing  = ref(false)
const result     = ref(null)

function triggerFileInput() { fileInput.value?.click() }

async function onFileSelect(e) { await readAndPreview(e.target.files[0]) }
async function onDrop(e) { dragging.value = false; await readAndPreview(e.dataTransfer.files[0]) }

async function readAndPreview(file) {
  if (!file) return
  result.value = null
  const text = await file.text()
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = lines.slice(1).map(l => {
    const vals = l.split(',').map(v => v.trim().replace(/"/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']))
  })
  totalRows.value  = rows.length
  preview.value    = rows.slice(0, 10)
}

async function runImport() {
  importing.value = true; result.value = null
  const res = await window.api.importCSV()
  if (res.error === 'cancelled') { importing.value = false; return }
  result.value = res
  if (res.success) {
    preview.value = res.preview || preview.value
    totalRows.value = res.count
    window.$toast?.({ type: 'success', title: t('import.success', { count: res.count }) })
  } else {
    window.$toast?.({ type: 'error', title: t('common.error'), message: res.error })
  }
  importing.value = false
}

function downloadSample() {
  const csv = `barcode,name_en,name_si,cost_price,selling_price,stock\n4820123456789,Rice 1kg,හාල් 1kg,180,220,100\n4820987654321,Sugar 1kg,සීනි 1kg,160,195,80\n4810001122334,Milk Powder 400g,කිරිපිටි 400g,450,520,50`
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = 'sample_products.csv'; a.click()
}
</script>
