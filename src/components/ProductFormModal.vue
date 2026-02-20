<template>
  <teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box max-w-lg">
        <div class="modal-header">
          <h2 class="text-lg font-bold text-white" :class="{ si: locale === 'si' }">
            {{ isEdit ? t('productForm.editTitle') : t('productForm.addTitle') }}
          </h2>
          <button @click="$emit('close')" class="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700">✕</button>
        </div>

        <form @submit.prevent="save" class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Barcode -->
            <div class="col-span-2">
              <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('inventory.barcode') }}</label>
              <input v-model="form.barcode" class="input-field" :placeholder="t('productForm.barcodeHint')" />
            </div>
            <!-- Name EN -->
            <div>
              <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('inventory.nameEn') }} *</label>
              <input v-model="form.name_en" class="input-field" required :placeholder="t('inventory.nameEn')" />
            </div>
            <!-- Name SI -->
            <div>
              <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('inventory.nameSi') }}</label>
              <input v-model="form.name_si" class="input-field si" :placeholder="t('inventory.nameSi')" />
            </div>
            <!-- Cost Price -->
            <div>
              <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('inventory.costPrice') }} (Rs.)</label>
              <input v-model.number="form.cost_price" type="number" min="0" step="0.01" class="input-field" placeholder="0.00" />
            </div>
            <!-- Selling Price -->
            <div>
              <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('inventory.sellingPrice') }} (Rs.) *</label>
              <input v-model.number="form.selling_price" type="number" min="0.01" step="0.01" required class="input-field" placeholder="0.00" />
            </div>
            <!-- Stock -->
            <div class="col-span-2">
              <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('inventory.stock') }}</label>
              <input v-model.number="form.stock" type="number" min="0" class="input-field" placeholder="0" />
            </div>
          </div>

          <p v-if="error" class="text-red-400 text-sm">⚠️ {{ error }}</p>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="$emit('close')" class="btn-secondary flex-1 justify-center">{{ t('productForm.cancel') }}</button>
            <button type="submit" :disabled="saving" class="btn-primary flex-1 justify-center">
              {{ saving ? t('common.loading') : t('productForm.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const props  = defineProps({ product: Object })
const emit   = defineEmits(['close', 'saved'])
const isEdit = !!props.product
const saving = ref(false)
const error  = ref('')

const form = ref({
  barcode: '', name_en: '', name_si: '', cost_price: 0, selling_price: 0, stock: 0,
  ...(props.product || {})
})

async function save() {
  saving.value = true
  error.value  = ''
  try {
    // Strip Vue reactive Proxy → plain object (IPC requires structured-clone-safe data)
    const payload = JSON.parse(JSON.stringify(form.value))
    const fn  = isEdit ? window.api.updateProduct : window.api.addProduct
    const res = await fn(payload)
    if (!res.success) throw new Error(res.error)
    window.$toast?.({ type: 'success', title: t('productForm.save'), message: form.value.name_en })
    emit('saved', res.data)
  } catch (e) { error.value = e.message }
  finally     { saving.value = false }
}
</script>
