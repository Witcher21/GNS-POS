const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const https = require('https')

// Suppress harmless GPU/cache warnings on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-gpu-process-crash-limit')
app.disableHardwareAcceleration()

let db
const isDev = process.argv.includes('--dev')

function getDB() {
  if (!db) {
    const { initDB } = require('./database')
    db = initDB()
  }
  return db
}

// Detect which port Vite is running on (handles port conflicts gracefully)
function detectVitePort(ports) {
  return new Promise((resolve) => {
    let checked = 0
    for (const port of ports) {
      const req = http.get(`http://localhost:${port}`, res => {
        resolve(port)
        req.destroy()
      })
      req.on('error', () => {
        checked++
        if (checked === ports.length) resolve(ports[0]) // fallback
      })
      req.setTimeout(500, () => {
        req.destroy()
        checked++
        if (checked === ports.length) resolve(ports[0])
      })
    }
  })
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    // Dynamically detect which port Vite is running on (5173 or 5174)
    detectVitePort([5173, 5174]).then(port => {
      console.log(`[Electron] Connecting to Vite on port ${port}`)
      mainWindow.loadURL(`http://localhost:${port}`)
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  getDB()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Products ────────────────────────────────────────────
ipcMain.handle('get-products', () => {
  try { return { success: true, data: getDB().getProducts() } }
  catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('search-products', (_, query) => {
  try { return { success: true, data: getDB().searchProducts(query) } }
  catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('add-product', (_, p) => {
  try { return { success: true, data: getDB().addProduct(p) } }
  catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('update-product', (_, p) => {
  try { return { success: true, data: getDB().updateProduct(p) } }
  catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('delete-product', (_, id) => {
  try { return { success: true, data: getDB().deleteProduct(id) } }
  catch (e) { return { success: false, error: e.message } }
})

// ─── Checkout ────────────────────────────────────────────
ipcMain.handle('process-checkout', (_, data) => {
  try { return { success: true, data: getDB().processCheckout(data) } }
  catch (e) { return { success: false, error: e.message } }
})

// ─── Bulk CSV Import ─────────────────────────────────────
ipcMain.handle('import-csv', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      title: 'Select Products CSV'
    })
    if (canceled || !filePaths.length) return { success: false, error: 'cancelled' }

    const rows = await parseCSV(filePaths[0])
    const count = getDB().bulkInsertProducts(rows)
    return { success: true, count, preview: rows.slice(0, 10) }
  } catch (e) { return { success: false, error: e.message } }
})

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const csvParser = require('csv-parser')
    const results = []
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', d => results.push(d))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

// ─── PDF Receipt ─────────────────────────────────────────
ipcMain.handle('print-receipt', async (_, invoiceData) => {
  try {
    const { buildReceiptHTML } = require('./receiptTemplate')
    const html = buildReceiptHTML(invoiceData)

    const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } })
    await win.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A5',
      printBackground: true,
      margins: { marginType: 'custom', top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 }
    })
    win.close()

    const dir = path.join(app.getPath('documents'), 'GNS-POS', 'receipts')
    fs.mkdirSync(dir, { recursive: true })
    const pdfPath = path.join(dir, `receipt-${invoiceData.invoiceId}-${Date.now()}.pdf`)
    fs.writeFileSync(pdfPath, pdfBuffer)
    shell.openPath(pdfPath)
    return { success: true, path: pdfPath }
  } catch (e) { return { success: false, error: e.message } }
})

// ─── SMS via Notify.lk ───────────────────────────────────
const DEFAULT_SMS_CFG = { userId: '31066', apiKey: 'GUPiUO2alhI6z1xljfPR', senderId: 'NotifyDEMO' }

ipcMain.handle('send-sms', async (_, { phone, message }) => {
  const settingsPath = path.join(app.getPath('userData'), 'sms-settings.json')
  let cfg = { ...DEFAULT_SMS_CFG }
  try { Object.assign(cfg, JSON.parse(fs.readFileSync(settingsPath, 'utf8'))) } catch {}

  const { userId, apiKey, senderId } = cfg
  if (!userId || !apiKey) {
    console.log(`[SMS MOCK] No API key — To: ${phone} | ${message}`)
    return { success: true, mock: true, message: `Mock SMS to ${phone}` }
  }

  // Normalize to 94XXXXXXXXX (Notify.lk requires 11-digit Sri Lanka format)
  let to = phone.replace(/\D/g, '')
  if (to.startsWith('0')) to = '94' + to.slice(1)
  else if (!to.startsWith('94')) to = '94' + to
  console.log(`[SMS] Sending to: ${to}`)

  return new Promise((resolve) => {
    const params = new URLSearchParams({
      user_id: userId, api_key: apiKey,
      sender_id: senderId || 'NotifyDEMO',
      to: to, message
    }).toString()
    const options = {
      hostname: 'app.notify.lk', path: `/api/v1/send?${params}`,
      method: 'GET'
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        console.log(`[SMS] Notify.lk response: ${data}`)
        try {
          const json = JSON.parse(data)
          resolve({ success: json.status === 'success', message: data })
        } catch { resolve({ success: true, message: data }) }
      })
    })
    req.on('error', e => resolve({ success: false, error: e.message }))
    req.end()
  })
})

// ─── Save SMS Settings ────────────────────────────────────
ipcMain.handle('save-sms-settings', (_, cfg) => {
  const settingsPath = path.join(app.getPath('userData'), 'sms-settings.json')
  fs.writeFileSync(settingsPath, JSON.stringify(cfg, null, 2))
  return { success: true }
})

ipcMain.handle('get-sms-settings', () => {
  const settingsPath = path.join(app.getPath('userData'), 'sms-settings.json')
  try { return { success: true, data: JSON.parse(fs.readFileSync(settingsPath, 'utf8')) } }
  catch { return { success: true, data: {} } }
})

// ─── Seed Database ────────────────────────────────────────
ipcMain.handle('seed-database', () => {
  try {
    const products = require('./seedData')
    getDB().bulkInsertProducts(products.map(p => ({
      barcode: p.barcode, name_en: p.name_en, name_si: p.name_si,
      cost_price: p.cost_price, selling_price: p.selling_price, stock: p.stock
    })))
    return { success: true, count: products.length }
  } catch (e) { return { success: false, error: e.message } }
})

// ─── Z-Report ────────────────────────────────────────────
ipcMain.handle('get-z-report', (_, date) => {
  try { return { success: true, data: getDB().getZReport(date) } }
  catch (e) { return { success: false, error: e.message } }
})

// ─── Invoice History ─────────────────────────────────────
ipcMain.handle('get-invoices', (_, opts) => {
  try { return { success: true, data: getDB().getInvoices(opts) } }
  catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('get-invoice-detail', (_, id) => {
  try { return { success: true, data: getDB().getInvoiceDetail(id) } }
  catch (e) { return { success: false, error: e.message } }
})
