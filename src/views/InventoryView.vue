<template>
  <div class="flex flex-col h-full p-4 gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <input v-model="search" class="input-field w-64" :placeholder="t('inventory.search')" @input="filterProducts" />
        <span class="text-slate-500 text-sm" :class="{ si: locale === 'si' }">{{ t('inventory.totalProducts', { count: filtered.length }) }}</span>
      </div>
      <button @click="openAdd" class="btn-primary" :class="{ si: locale === 'si' }">
        <span>＋</span> {{ t('inventory.addProduct') }}
      </button>
    </div>

    <!-- Table -->
    <div class="flex-1 card overflow-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-slate-800">
          <tr>
            <th v-for="h in headers" :key="h.key" class="table-header px-4 py-2.5 text-left whitespace-nowrap"
              :class="{ si: locale === 'si' && h.si, 'text-right': h.right }">{{ t(h.label) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-10 text-slate-500">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="7" class="text-center py-10 text-slate-500" :class="{ si: locale === 'si' }">{{ t('inventory.noProducts') }}</td></tr>
          <tr v-for="p in filtered" :key="p.id" class="border-t border-slate-700/40 hover:bg-slate-700/20 transition-colors">
            <td class="px-4 py-3 text-slate-400 text-xs">{{ p.barcode || '—' }}</td>
            <td class="px-4 py-3 font-medium text-white">{{ p.name_en }}</td>
            <td class="px-4 py-3 text-slate-300 si">{{ p.name_si || '—' }}</td>
            <td class="px-4 py-3 text-right text-slate-400">Rs. {{ parseFloat(p.cost_price).toFixed(2) }}</td>
            <td class="px-4 py-3 text-right font-semibold text-emerald-400">Rs. {{ parseFloat(p.selling_price).toFixed(2) }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="p.stock > 10 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'">{{ p.stock }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openEdit(p)" class="btn-ghost py-1 px-2 text-xs text-blue-400 hover:text-blue-300">✏️ {{ t('inventory.edit') }}</button>
                <button @click="confirmDelete(p)" class="btn-ghost py-1 px-2 text-xs text-red-400 hover:text-red-300">🗑 {{ t('inventory.delete') }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ProductFormModal v-if="showForm" :product="editProduct" @close="showForm = false" @saved="onSaved" />
    <ConfirmDialog v-if="showConfirm" :message="t('common.deleteConfirm')" @confirm="doDelete" @cancel="showConfirm = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ProductFormModal from '../components/ProductFormModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const { t, locale } = useI18n()
const products  = ref([])
const filtered  = ref([])
const search    = ref('')
const loading   = ref(false)
const showForm  = ref(false)
const showConfirm = ref(false)
const editProduct = ref(null)
const deleteTarget = ref(null)

const headers = [
  { key: 'barcode', label: 'inventory.barcode' },
  { key: 'name_en', label: 'inventory.nameEn' },
  { key: 'name_si', label: 'inventory.nameSi', si: true },
  { key: 'cost', label: 'inventory.costPrice', right: true },
  { key: 'price', label: 'inventory.sellingPrice', right: true },
  { key: 'stock', label: 'inventory.stock' },
  { key: 'actions', label: 'inventory.actions' }
]

async function load() {
  loading.value = true
  const res = await window.api.getProducts()
  if (res.success) { products.value = res.data; filtered.value = res.data }
  loading.value = false
}

function filterProducts() {
  const q = search.value.toLowerCase()
  filtered.value = q ? products.value.filter(p =>
    p.name_en.toLowerCase().includes(q) || (p.name_si || '').includes(q) || (p.barcode || '').includes(q)
  ) : products.value
}

function openAdd()  { editProduct.value = null; showForm.value = true }
function openEdit(p){ editProduct.value = p; showForm.value = true }
function confirmDelete(p) { deleteTarget.value = p; showConfirm.value = true }

async function doDelete() {
  showConfirm.value = false
  const res = await window.api.deleteProduct(deleteTarget.value.id)
  if (res.success) {
    window.$toast?.({ type: 'success', title: 'Deleted', message: deleteTarget.value.name_en })
    await load()
  }
}

function onSaved() { showForm.value = false; load() }
onMounted(load)
</script>
