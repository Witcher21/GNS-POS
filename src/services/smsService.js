/**
 * SMS Service — Mock implementation
 * Replace with real Sri Lankan gateway (e.g. Hutch, Dialog, Mobitel API)
 */
export async function sendSMS(phone, invoiceId, total) {
  const message = `Thank you for shopping at GNS Super Market! Bill Total: Rs. ${parseFloat(total).toFixed(2)}. Invoice ID: #${invoiceId}. | ගෙනීම ගැන ස්තූතියි!`
  try {
    const res = await window.api.sendSms(phone, message)
    console.log('[SMS Service]', res)
    return res
  } catch (err) {
    console.error('[SMS Service] Error:', err)
    return { success: false, error: err.message }
  }
}
