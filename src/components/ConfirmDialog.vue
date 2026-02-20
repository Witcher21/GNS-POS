<template>
  <teleport to="body">
    <div class="modal-overlay" @click.self="$emit('cancel')">
      <div class="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 text-xl">⚠️</div>
          <div class="flex-1">
            <h3 class="text-white font-semibold text-base mb-1">{{ title || t('common.confirm') }}</h3>
            <p class="text-slate-400 text-sm">{{ message || t('common.deleteConfirm') }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6 justify-end">
          <button @click="$emit('cancel')" class="btn-secondary px-5 py-2 text-sm">{{ t('common.cancel') }}</button>
          <button @click="$emit('confirm')" class="btn-danger px-5 py-2 text-sm">{{ t('common.yes') }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
defineProps({ title: String, message: String })
defineEmits(['confirm', 'cancel'])
</script>
