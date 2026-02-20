const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

let db

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'gns_pos.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createSchema()
  console.log('[DB] Initialized at:', dbPath)
  return {
    getProducts, searchProducts, addProduct, updateProduct, deleteProduct,
    processCheckout, bulkInsertProducts, getZReport, getInvoices, getInvoiceDetail
  }
}

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode       TEXT UNIQUE,
      name_en       TEXT NOT NULL,
      name_si       TEXT NOT NULL DEFAULT '',
      cost_price    REAL DEFAULT 0,
      selling_price REAL NOT NULL,
      stock         INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      subtotal       REAL NOT NULL,
      total          REAL NOT NULL,
      cash_paid      REAL DEFAULT 0,
      card_paid      REAL DEFAULT 0,
      change_given   REAL DEFAULT 0,
      customer_phone TEXT,
      sms_sent       INTEGER DEFAULT 0,
      pdf_path       TEXT,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invoice_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id      INTEGER NOT NULL REFERENCES invoices(id),
      product_id      INTEGER REFERENCES products(id),
      product_name_en TEXT NOT NULL,
      product_name_si TEXT NOT NULL DEFAULT '',
      qty             INTEGER NOT NULL,
      unit_price      REAL NOT NULL,
      line_total      REAL NOT NULL
    );
  `)
}

// ─── Products ─────────────────────────────────────────────
function getProducts() {
  return db.prepare('SELECT * FROM products ORDER BY name_en ASC').all()
}

function searchProducts(query) {
  if (!query) return getProducts()
  const q = `%${query}%`
  return db.prepare(`
    SELECT * FROM products
    WHERE barcode = ? OR name_en LIKE ? OR name_si LIKE ?
    LIMIT 30
  `).all(query, q, q)
}

function addProduct(p) {
  const r = db.prepare(`
    INSERT INTO products (barcode, name_en, name_si, cost_price, selling_price, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(p.barcode || null, p.name_en, p.name_si || '', p.cost_price || 0, p.selling_price, p.stock || 0)
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid)
  return row ? { ...row } : { id: Number(r.lastInsertRowid) }
}

function updateProduct(p) {
  db.prepare(`
    UPDATE products SET barcode=?, name_en=?, name_si=?, cost_price=?, selling_price=?, stock=?
    WHERE id=?
  `).run(p.barcode || null, p.name_en, p.name_si || '', p.cost_price || 0, p.selling_price, p.stock || 0, p.id)
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(p.id)
  return row ? { ...row } : { id: p.id }
}

function deleteProduct(id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return { id }
}

// ─── Checkout (Transaction) ────────────────────────────────
function processCheckout({ items, cashPaid, cardPaid, customerPhone, total, subtotal }) {
  return db.transaction(() => {
    const change = Math.max(0, (parseFloat(cashPaid) || 0) - parseFloat(total))
    const inv = db.prepare(`
      INSERT INTO invoices (subtotal, total, cash_paid, card_paid, change_given, customer_phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(subtotal, total, cashPaid || 0, cardPaid || 0, change, customerPhone || null)
    const invoiceId = inv.lastInsertRowid

    const itemStmt = db.prepare(`
      INSERT INTO invoice_items (invoice_id, product_id, product_name_en, product_name_si, qty, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const stockStmt = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?')

    for (const item of items) {
      itemStmt.run(invoiceId, item.id, item.name_en, item.name_si || '', item.qty, item.selling_price, item.qty * item.selling_price)
      stockStmt.run(item.qty, item.id)
    }
    return { invoiceId, change, total, subtotal, cashPaid, cardPaid, customerPhone, items, createdAt: new Date().toISOString() }
  })()
}

// ─── Bulk CSV Import ───────────────────────────────────────
function bulkInsertProducts(rows) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO products (barcode, name_en, name_si, cost_price, selling_price, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  return db.transaction((items) => {
    for (const r of items) {
      stmt.run(r.barcode || null, r.name_en || r.name || '', r.name_si || '', parseFloat(r.cost_price) || 0, parseFloat(r.selling_price) || 0, parseInt(r.stock) || 0)
    }
    return items.length
  })(rows)
}

// ─── Z-Report ─────────────────────────────────────────────
function getZReport(date) {
  const d = date || new Date().toISOString().split('T')[0]
  const summary = db.prepare(`
    SELECT COUNT(*) as invoice_count, COALESCE(SUM(total),0) as total_sales,
           COALESCE(SUM(cash_paid),0) as total_cash, COALESCE(SUM(card_paid),0) as total_card
    FROM invoices WHERE DATE(created_at) = ?
  `).get(d)
  const topProducts = db.prepare(`
    SELECT ii.product_name_en, ii.product_name_si,
           SUM(ii.qty) as total_qty, SUM(ii.line_total) as total_revenue
    FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.id
    WHERE DATE(i.created_at) = ?
    GROUP BY ii.product_id ORDER BY total_revenue DESC LIMIT 10
  `).all(d)
  const hourly = db.prepare(`
    SELECT strftime('%H:00', created_at) as hour, COUNT(*) as count, COALESCE(SUM(total),0) as total
    FROM invoices WHERE DATE(created_at) = ?
    GROUP BY strftime('%H', created_at) ORDER BY hour
  `).all(d)
  return { date: d, summary, topProducts, hourly }
}

// ─── Invoice History ──────────────────────────────────────
function getInvoices({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const total = db.prepare('SELECT COUNT(*) as c FROM invoices').get().c
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset)
  return { invoices, total, page, limit, pages: Math.ceil(total / limit) }
}

function getInvoiceDetail(id) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
  if (!invoice) return null
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id)
  return { ...invoice, items }
}

module.exports = { initDB }
