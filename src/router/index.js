import { createRouter, createWebHashHistory } from 'vue-router'
import CashierTerminal from '../views/CashierTerminal.vue'
import InventoryView from '../views/InventoryView.vue'
import BulkImportView from '../views/BulkImportView.vue'
import InvoiceHistoryView from '../views/InvoiceHistoryView.vue'
import ZReportView from '../views/ZReportView.vue'
import SettingsView from '../views/SettingsView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',         name: 'cashier',   component: CashierTerminal },
    { path: '/inventory',name: 'inventory', component: InventoryView },
    { path: '/import',   name: 'import',    component: BulkImportView },
    { path: '/invoices', name: 'invoices',  component: InvoiceHistoryView },
    { path: '/zreport',  name: 'zreport',   component: ZReportView },
    { path: '/settings', name: 'settings',  component: SettingsView }
  ]
})
