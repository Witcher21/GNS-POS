import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import router from './router'
import App from './App.vue'
import './assets/main.css'

import en from './locales/en.json'
import si from './locales/si.json'

const i18n = createI18n({
  legacy: false,
  locale: 'si',
  fallbackLocale: 'en',
  messages: { en, si }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
