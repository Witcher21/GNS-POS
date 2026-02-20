<template>
  <div class="relative">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="t('cashier.searchPlaceholder')"
          class="input-field pl-10 pr-4 text-base h-12"
          :class="{ si: locale === 'si' }"
          @input="onInput"
          @keydown.enter="onEnter"
          @keydown.escape="clearSearch"
          autocomplete="off"
        />
      </div>
      <button v-if="query" @click="clearSearch" class="btn-secondary h-12 px-3">✕</button>
    </div>

    <!-- Dropdown Results -->
    <div v-if="results.length && showDropdown"
      class="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto">
      <div v-for="p in results" :key="p.id"
        @click="selectProduct(p)"
        class="flex items-center justify-between px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors">
        <div>
          <div class="text-white text-sm font-medium">{{ locale === 'si' ? p.name_si || p.name_en : p.name_en }}</div>
          <div class="text-slate-400 text-xs flex gap-3 mt-0.5">
            <span v-if="p.barcode">📷 {{ p.barcode }}</span>
            <span :class="p.stock > 5 ? 'text-emerald-400' : p.stock > 0 ? 'text-amber-400' : 'text-red-400'">
              {{ t('cashier.stock', { n: p.stock }) || `Stock: ${p.stock}` }}
            </span>
          </div>
        </div>
        <div class="text-emerald-400 font-bold text-sm">Rs. {{ p.selling_price.toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const emit = defineEmits(['product-selected'])

const query = ref('')
const results = ref([])
const showDropdown = ref(false)
const inputRef = ref(null)

let debounceTimer

async function onInput() {
  clearTimeout(debounceTimer)
  if (!query.value.trim()) { results.value = []; showDropdown.value = false; return }
  debounceTimer = setTimeout(doSearch, 200)
}

async function doSearch() {
  if (!query.value.trim()) return
  const res = await window.api.searchProducts(query.value.trim())
  if (res.success) {
    results.value = res.data
    showDropdown.value = true
  }
}

async function onEnter() {
  if (results.value.length === 1) { selectProduct(results.value[0]); return }
  if (results.value.length === 0) await doSearch()
  if (results.value.length === 1) selectProduct(results.value[0])
}

function selectProduct(p) {
  emit('product-selected', p)
  clearSearch()
  inputRef.value?.focus()
}

function clearSearch() {
  query.value = ''
  results.value = []
  showDropdown.value = false
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
