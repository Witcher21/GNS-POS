function buildReceiptHTML(inv) {
  const { invoiceId, items = [], total, subtotal, cashPaid, cardPaid, change, customerPhone, createdAt } = inv
  const date = new Date(createdAt || Date.now()).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })
  const fmt = (n) => `Rs. ${parseFloat(n || 0).toFixed(2)}`

  const rows = items.map(i => `
    <tr>
      <td>${i.product_name_en}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">${fmt(i.unit_price)}</td>
      <td style="text-align:right">${fmt(i.line_total)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;font-size:12px;color:#111;padding:16px;max-width:300px}
  .si{font-family:'Noto Sans Sinhala',sans-serif}
  .hdr{text-align:center;border-bottom:2px dashed #333;padding-bottom:10px;margin-bottom:10px}
  .store{font-size:20px;font-weight:700}
  .meta{margin-bottom:10px}
  .meta-row{display:flex;justify-content:space-between;margin-bottom:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:11px}
  th{border-bottom:1px solid #333;padding:3px 2px;text-align:left;font-size:10px;text-transform:uppercase}
  td{padding:4px 2px;border-bottom:1px dotted #ddd}
  .totals{border-top:2px dashed #333;padding-top:8px}
  .t-row{display:flex;justify-content:space-between;margin-bottom:4px}
  .grand{font-size:15px;font-weight:700;color:#065f46;margin-top:6px}
  .footer{text-align:center;margin-top:14px;border-top:1px dashed #ccc;padding-top:10px}
  .ty{font-family:'Noto Sans Sinhala',sans-serif;font-size:14px;font-weight:700;color:#065f46}
</style></head><body>
  <div class="hdr">
    <div class="store">GNS Super Market</div>
    <div class="si" style="font-size:11px;color:#444;margin-top:2px">ගුණාත්මක භාණ්ඩ · සාධාරණ මිල</div>
    <div style="font-size:10px;color:#999">Quality Products · Fair Prices</div>
  </div>
  <div class="meta">
    <div class="meta-row"><span>Invoice #</span><span><b>${invoiceId}</b></span></div>
    <div class="meta-row"><span>Date</span><span>${date}</span></div>
    ${customerPhone ? `<div class="meta-row"><span>Phone</span><span>${customerPhone}</span></div>` : ''}
  </div>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="t-row"><span>Subtotal</span><span>${fmt(subtotal || total)}</span></div>
    ${cashPaid > 0 ? `<div class="t-row"><span>Cash</span><span>${fmt(cashPaid)}</span></div>` : ''}
    ${cardPaid > 0 ? `<div class="t-row"><span>Card</span><span>${fmt(cardPaid)}</span></div>` : ''}
    ${change > 0 ? `<div class="t-row"><span>Change</span><span>${fmt(change)}</span></div>` : ''}
    <div class="t-row grand"><span>TOTAL PAID</span><span>${fmt(total)}</span></div>
  </div>
  <div class="footer">
    <div class="ty">ගෙනීම ගැන ස්තූතියි!</div>
    <div style="font-size:11px;color:#555;margin-top:4px">Thank you for your purchase!</div>
    <div style="font-size:9px;color:#aaa;margin-top:8px">GNS-POS v2.0</div>
  </div>
</body></html>`
}

module.exports = { buildReceiptHTML }
