<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-900">
    <!-- Sidebar -->
    <aside class="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-700/60 flex flex-col">
      <!-- Logo -->
      <div class="px-4 py-5 border-b border-slate-700/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">G</div>
          <div>
            <div class="font-bold text-white text-sm leading-tight">GNS POS</div>
            <div class="text-slate-500 text-xs" :class="{ si: locale === 'si' }">{{ t('app.tagline') }}</div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="nav-item" :class="{ active: $route.path === item.to }">
          <span class="text-lg">{{ item.icon }}</span>
          <span :class="{ si: locale === 'si' }">{{ t(item.labelKey) }}</span>
        </RouterLink>
      </nav>

      <!-- Language Toggle -->
      <div class="px-3 py-4 border-t border-slate-700/60">
        <button @click="toggleLang"
          class="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 transition-all duration-150">
          <span class="text-xs text-slate-400">Language / භාෂාව</span>
          <span class="text-xs font-bold text-emerald-400">{{ locale === 'si' ? 'SI' : 'EN' }}</span>
        </button>
        <div class="mt-2 text-center text-xs text-slate-600">v2.0.0</div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="h-14 bg-slate-800/50 border-b border-slate-700/60 flex items-center justify-between px-6 flex-shrink-0">
        <div>
          <h1 class="text-white font-semibold" :class="{ si: locale === 'si' }">
            {{ t(currentPageKey) }}
          </h1>
        </div>
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <span>{{ settings.storeName }}</span>
          <span class="text-slate-600">|</span>
          <span>{{ currentTime }}</span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-hidden">
        <RouterView />
      </main>
    </div>

    <!-- Toast Notifications -->
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings'
import ToastNotification from './components/ToastNotification.vue'

const { t, locale } = useI18n()
const route = useRoute()
const settings = useSettingsStore()

// Restore saved language on startup
onMounted(() => {
  const saved = localStorage.getItem('gns_lang')
  if (saved) locale.value = saved
})

const navItems = [
  { to: '/',         icon: '🏪', labelKey: 'nav.cashier' },
  { to: '/inventory',icon: '📦', labelKey: 'nav.inventory' },
  { to: '/import',   icon: '📂', labelKey: 'nav.import' },
  { to: '/invoices', icon: '🧾', labelKey: 'nav.invoices' },
  { to: '/zreport',  icon: '📊', labelKey: 'nav.zreport' },
  { to: '/settings', icon: '⚙️', labelKey: 'nav.settings' }
]

const pageKeyMap = {
  '/':          'nav.cashier',
  '/inventory': 'nav.inventory',
  '/import':    'nav.import',
  '/invoices':  'nav.invoices',
  '/zreport':   'nav.zreport',
  '/settings':  'nav.settings'
}
const currentPageKey = computed(() => pageKeyMap[route.path] || 'app.name')

function toggleLang() {
  locale.value = locale.value === 'si' ? 'en' : 'si'
  localStorage.setItem('gns_lang', locale.value)
}

// Live clock
const currentTime = ref('')
let clockInterval
function tick() {
  currentTime.value = new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
onMounted(() => { tick(); clockInterval = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(clockInterval))
</script>
