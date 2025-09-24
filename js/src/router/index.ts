// router/index.js
import {createRouter, createWebHashHistory} from 'vue-router'
import App from '@/App.vue'
import {Settings, Payments, Logistics, Invoices, Integration} from '@/pages'


const routes = [
    {path: '/', component: App},
    {path: '/payments', component: Payments},
    {path: '/payments/:id', component: Integration},
    {path: '/logistics', component: Logistics},
    {path: '/invoices', component: Invoices},
    {path: '/settings', component: Settings}
]

const router = createRouter({
    history: createWebHashHistory(), // 使用 Hash 模式
    routes
})

export default router
