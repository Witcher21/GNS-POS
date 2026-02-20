<template>
  <!-- Global toast container -->
  <teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" style="min-width:320px">
      <transition-group name="toast">
        <div v-for="toast in toasts" :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm"
          :class="toastClass(toast.type)">
          <span class="text-lg flex-shrink-0 mt-0.5">{{ toastIcon(toast.type) }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold leading-tight">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs mt-0.5 opacity-80">{{ toast.message }}</p>
          </div>
          <button @click="removeToast(toast.id)" class="opacity-60 hover:opacity-100 flex-shrink-0 text-sm">✕</button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

function toastClass(type) {
  return {
    success: 'bg-emerald-900/90 border-emerald-700 text-emerald-100',
    error:   'bg-red-900/90 border-red-700 text-red-100',
    info:    'bg-blue-900/90 border-blue-700 text-blue-100',
    warning: 'bg-amber-900/90 border-amber-700 text-amber-100'
  }[type] || 'bg-slate-800/90 border-slate-600 text-slate-100'
}
function toastIcon(type) {
  return { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type] || '💬'
}
function removeToast(id) { toasts.value = toasts.value.filter(t => t.id !== id) }

// Expose globally via window
function addToast({ type = 'info', title, message, duration = 4000 }) {
  const id = nextId++
  toasts.value.push({ id, type, title, message })
  if (duration > 0) setTimeout(() => removeToast(id), duration)
}

// Make callable globally
if (typeof window !== 'undefined') {
  window.$toast = addToast
}
</script>

<style scoped>
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .2s ease; }
.toast-enter-from  { opacity: 0; transform: translateX(40px) scale(.95); }
.toast-leave-to    { opacity: 0; transform: translateX(20px) scale(.95); }
</style>
