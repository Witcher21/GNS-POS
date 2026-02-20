<template>
  <teleport to="body">
    <div class="modal-overlay">
      <div class="modal-box max-w-xl">
        <div class="modal-header">
          <h2 class="text-lg font-bold text-white" :class="{ si: locale === 'si' }">{{ t('checkout.title') }}</h2>
          <button @click="$emit('close')" class="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700">✕</button>
        </div>

        <div class="p-5 space-y-5">
          <!-- Order Summary -->
          <div class="bg-slate-900 rounded-xl p-4 max-h-48 overflow-y-auto">
            <div v-for="item in cart.items" :key="item.id" class="flex justify-between text-sm py-1 border-b border-slate-700/40 last:border-0">
              <span class="text-slate-300" :class="{ si: locale === 'si' }">
                {{ locale === 'si' ? item.name_si || item.name_en : item.name_en }} × {{ item.qty }}
              </span>
              <span class="text-white font-medium">Rs. {{ (item.qty * item.selling_price).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-base font-bold mt-3 pt-2 border-t border-slate-600">
              <span :class="{ si: locale === 'si' }">{{ t('checkout.total') }}</span>
              <span class="text-emerald-400">Rs. {{ cart.total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div>
            <label class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block" :class="{ si: locale === 'si' }">{{ t('checkout.paymentMethod') }}</label>
            <div class="flex gap-3">
              <button @click="method = 'cash'" :class="[method === 'cash' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 text-slate-300 border-slate-600', { si: locale === 'si' }]"
                class="flex-1 py-2.5 rounded-lg border font-medium transition-all text-sm">
                💵 {{ t('checkout.cash') }}
              </button>
              <button @click="method = 'card'" :class="[method === 'card' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-300 border-slate-600', { si: locale === 'si' }]"
                class="flex-1 py-2.5 rounded-lg border font-medium transition-all text-sm">
                💳 {{ t('checkout.card') }}
              </button>
              <button @click="method = 'split'" :class="method === 'split' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-700 text-slate-300 border-slate-600'"
                class="flex-1 py-2.5 rounded-lg border font-medium transition-all text-sm">
                ⚡ Split
              </button>
            </div>
          </div>

          <!-- Payment Inputs -->
          <div class="grid grid-cols-2 gap-3">
            <div v-if="method !== 'card'">
              <label class="text-slate-400 text-xs mb-1 block" :class="{ si: locale === 'si' }">{{ t('checkout.cashAmount') }}</label>
              <input v-model.number="cashPaid" type="number" min="0" step="0.01" class="input-field" placeholder="0.00" @input="calcChange" />
            </div>
            <div v-if="method !== 'cash'">
              <label class="text-slate-400 text-xs mb-1 block" :class="{ si: locale === 'si' }">{{ t('checkout.cardAmount') }}</label>
              <input v-model.number="cardPaid" type="number" min="0" step="0.01" class="input-field" placeholder="0.00" />
            </div>
            <div v-if="method !== 'card' && change >= 0">
              <label class="text-slate-400 text-xs mb-1 block" :class="{ si: locale === 'si' }">{{ t('checkout.change') }}</label>
              <div class="input-field bg-slate-900 font-bold" :class="change < 0 ? 'text-red-400' : 'text-emerald-400'">
                Rs. {{ Math.max(0, change).toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- Phone + SMS -->
          <div>
            <label class="text-slate-400 text-xs mb-1 block" :class="{ si: locale === 'si' }">{{ t('checkout.customerPhone') }}</label>
            <div class="flex gap-2">
              <input v-model="customerPhone" type="tel" class="input-field flex-1" :placeholder="t('checkout.phonePlaceholder')" maxlength="15" />
              <label class="flex items-center gap-2 bg-slate-700 rounded-lg px-3 cursor-pointer">
                <input type="checkbox" v-model="sendSms" class="rounded" />
                <span class="text-xs text-slate-300 whitespace-nowrap" :class="{ si: locale === 'si' }">{{ t('checkout.sendSms') }}</span>
              </label>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">⚠️ {{ error }}</p>

          <!-- Confirm -->
          <button @click="confirm" :disabled="processing || !canConfirm" class="btn-primary w-full justify-center py-3 text-base">
            <span v-if="processing" class="animate-spin">⏳</span>
            <span :class="{ si: locale === 'si' }">{{ processing ? t('common.loading') : t('checkout.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart'
import { sendSMS } from '../services/smsService'

const { t, locale } = useI18n()
const cart = useCartStore()
const emit = defineEmits(['close', 'confirmed'])

const method     = ref('cash')
const cashPaid   = ref('')
const cardPaid   = ref('')
const change     = ref(0)
const customerPhone = ref('')
const sendSms    = ref(false)
const processing = ref(false)
const error      = ref('')

function calcChange() {
  change.value = (parseFloat(cashPaid.value) || 0) - cart.total
}

const canConfirm = computed(() => {
  if (method.value === 'cash')  return (cashPaid.value || 0) >= cart.total
  if (method.value === 'card')  return true
  if (method.value === 'split') return ((cashPaid.value || 0) + (cardPaid.value || 0)) >= cart.total
  return false
})

async function confirm() {
  if (!canConfirm.value) { error.value = t('checkout.insufficientCash'); return }
  error.value = ''
  processing.value = true
  try {
    const checkoutData = {
      items: JSON.parse(JSON.stringify(cart.items)),
      total: cart.total,
      subtotal: cart.total,
      cashPaid: parseFloat(cashPaid.value) || 0,
      cardPaid: parseFloat(cardPaid.value) || 0,
      customerPhone: customerPhone.value || null
    }
    const res = await window.api.processCheckout(checkoutData)
    if (!res.success) throw new Error(res.error)
    const inv = res.data
    // PDF Receipt
    await window.api.printReceipt(inv)
    // SMS
    if (sendSms.value && customerPhone.value) {
      await sendSMS(customerPhone.value, inv.invoiceId, inv.total)
      window.$toast?.({ type: 'info', title: t('checkout.smsSent', { phone: customerPhone.value }) })
    }
    window.$toast?.({ type: 'success', title: t('checkout.success', { id: inv.invoiceId }) })
    cart.clearCart()
    emit('confirmed', inv)
  } catch (e) {
    error.value = e.message
  } finally {
    processing.value = false
  }
}
</script>
