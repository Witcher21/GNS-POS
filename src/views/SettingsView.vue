<template>
  <div class="flex items-start justify-center h-full p-6 overflow-auto">
    <div class="w-full max-w-lg space-y-4">

      <!-- Store Settings -->
      <div class="card space-y-4">
        <h2 class="text-lg font-bold text-white">⚙️ {{ t('settings.title') }}</h2>
        <div>
          <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{{ t('settings.storeName') }}</label>
          <input v-model="form.storeName" class="input-field" placeholder="GNS Super Market" />
        </div>
        <div>
          <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{{ t('settings.defaultLang') }}</label>
          <div class="flex gap-3">
            <button @click="form.lang = 'si'" :class="form.lang === 'si' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 text-slate-300 border-slate-600'"
              class="flex-1 py-2.5 rounded-lg border font-medium transition-all si">සිංහල</button>
            <button @click="form.lang = 'en'" :class="form.lang === 'en' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-300 border-slate-600'"
              class="flex-1 py-2.5 rounded-lg border font-medium transition-all">English</button>
          </div>
        </div>
        <button @click="save" class="btn-primary w-full justify-center py-2.5">💾 {{ t('settings.save') }}</button>
        <p v-if="saved" class="text-emerald-400 text-sm text-center">✅ {{ t('settings.saved') }}</p>
      </div>

      <!-- SMS Gateway (Notify.lk) -->
      <div class="card space-y-4">
        <h2 class="text-lg font-bold text-white">📱 SMS Gateway <span class="text-xs text-slate-400 font-normal ml-1">via Notify.lk</span></h2>
        <p class="text-slate-400 text-xs">Sign up free at <span class="text-blue-400">notify.lk</span> to get your User ID & API Key. Leave blank to use mock SMS.</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-slate-400 text-xs mb-1 block">User ID</label>
            <input v-model="sms.userId" class="input-field" placeholder="e.g. 1234" />
          </div>
          <div>
            <label class="text-slate-400 text-xs mb-1 block">Sender ID</label>
            <input v-model="sms.senderId" class="input-field" placeholder="NotifyDEMO" maxlength="11" />
          </div>
          <div class="col-span-2">
            <label class="text-slate-400 text-xs mb-1 block">API Key</label>
            <input v-model="sms.apiKey" class="input-field font-mono text-xs" placeholder="Your Notify.lk API Key" type="password" />
          </div>
        </div>
        <button @click="saveSms" class="btn-primary w-full justify-center py-2.5">💾 Save SMS Settings</button>
        <p v-if="smsSaved" class="text-emerald-400 text-sm text-center">✅ SMS settings saved!</p>
      </div>

      <!-- Seed Data -->
      <div class="card space-y-3">
        <h2 class="text-lg font-bold text-white">🌱 Sample Data</h2>
        <p class="text-slate-400 text-xs">Load ~500 realistic Sri Lankan supermarket products into the database. Safe to run multiple times (uses INSERT OR REPLACE).</p>
        <button @click="seed" :disabled="seeding" class="btn-secondary w-full justify-center py-2.5">
          <span v-if="seeding" class="animate-spin mr-1">⏳</span>
          {{ seeding ? 'Loading...' : '📦 Load Sample Products (~500)' }}
        </button>
        <p v-if="seedResult" :class="seedResult.success ? 'text-emerald-400' : 'text-red-400'" class="text-sm text-center">
          {{ seedResult.success ? `✅ ${seedResult.count} products loaded!` : `❌ ${seedResult.error}` }}
        </p>
      </div>

      <!-- About -->
      <div class="card text-xs text-slate-500 text-center space-y-1">
        <p class="font-semibold text-slate-400">GNS POS v2.0.0</p>
        <p>Enterprise Point of Sale · Designed for Sri Lankan Supermarkets</p>
        <p class="si text-slate-500">ශ්‍රී ලාංකීය සුපිරිසැල් සඳහා නිපදවා ඇත</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settings'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const saved = ref(false)
const smsSaved = ref(false)
const seeding = ref(false)
const seedResult = ref(null)

const form = ref({ storeName: settings.storeName, lang: settings.language })
const sms  = ref({ userId: '', apiKey: '', senderId: 'NotifyDEMO' })

onMounted(async () => {
  const res = await window.api.getSmsSettings()
  if (res.success && res.data) Object.assign(sms.value, res.data)
})

function save() {
  settings.save(form.value, { locale })
  locale.value = form.value.lang
  localStorage.setItem('gns_lang', form.value.lang)
  saved.value = true
  window.$toast?.({ type: 'success', title: t('settings.saved') })
  setTimeout(() => { saved.value = false }, 3000)
}

async function saveSms() {
  await window.api.saveSmsSettings(JSON.parse(JSON.stringify(sms.value)))
  smsSaved.value = true
  window.$toast?.({ type: 'success', title: 'SMS settings saved!' })
  setTimeout(() => { smsSaved.value = false }, 3000)
}

async function seed() {
  seeding.value = true
  seedResult.value = null
  const res = await window.api.seedDatabase()
  seedResult.value = res
  if (res.success) window.$toast?.({ type: 'success', title: `${res.count} products loaded!` })
  seeding.value = false
}
</script>
