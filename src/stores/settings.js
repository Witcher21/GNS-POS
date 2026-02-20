import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useSettingsStore = defineStore('settings', () => {
  const storeName = ref(localStorage.getItem('gns_storeName') || 'GNS Super Market')
  const language  = ref(localStorage.getItem('gns_lang') || 'si')

  function save({ name, lang }, i18n) {
    storeName.value = name
    language.value  = lang
    localStorage.setItem('gns_storeName', name)
    localStorage.setItem('gns_lang', lang)
    if (i18n) i18n.locale.value = lang
  }

  return { storeName, language, save }
})
