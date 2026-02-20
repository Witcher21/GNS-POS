const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Products
  getProducts:     ()  => ipcRenderer.invoke('get-products'),
  searchProducts:  (q) => ipcRenderer.invoke('search-products', q),
  addProduct:      (p) => ipcRenderer.invoke('add-product', p),
  updateProduct:   (p) => ipcRenderer.invoke('update-product', p),
  deleteProduct:   (id)=> ipcRenderer.invoke('delete-product', id),

  // Checkout
  processCheckout: (d) => ipcRenderer.invoke('process-checkout', d),

  // CSV Import
  importCSV: ()        => ipcRenderer.invoke('import-csv'),

  // PDF & SMS
  printReceipt: (d)    => ipcRenderer.invoke('print-receipt', d),
  sendSms: (phone, msg)=> ipcRenderer.invoke('send-sms', { phone, message: msg }),

  // Reports
  getZReport:        (date) => ipcRenderer.invoke('get-z-report', date),
  getInvoices:       (opts) => ipcRenderer.invoke('get-invoices', opts),
  getInvoiceDetail:  (id)   => ipcRenderer.invoke('get-invoice-detail', id),

  // Seed & SMS Settings
  seedDatabase:      ()    => ipcRenderer.invoke('seed-database'),
  saveSmsSettings:   (cfg) => ipcRenderer.invoke('save-sms-settings', cfg),
  getSmsSettings:    ()    => ipcRenderer.invoke('get-sms-settings'),
})
