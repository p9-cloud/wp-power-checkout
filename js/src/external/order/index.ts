// 訂單詳情頁掛載

import {createApp} from "vue";
import Dialog from "@/external/order/Dialog.vue";
import ElementPlus from "element-plus";
import 'element-plus/dist/index.css'
import '@/index.css'
import {QueryClient, VueQueryPlugin} from "@tanstack/vue-query";

const Module = () => {
    const form = document.querySelector('form#order')
    if (!form) {
        return;
    }

    const CONTAINER_ID = "pc-order-dialog";
    const body = document.querySelector('body')
    // 在 body 結束前 render div
    body?.insertAdjacentHTML('beforeend', `<div id="${CONTAINER_ID}"></div>`)

    // Mount Vue app
    const app = createApp(Dialog)

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 15 * 60 * 1000,     // 15 分鐘內視為新鮮
                gcTime: 15 * 60 * 1000, // 快取保留 15 分鐘
                retry: 0,                 // 最多重試 0 次
                refetchOnWindowFocus: false // 禁用視窗聚焦時重新請求
            },
            mutations: {
                retry: 0 // mutation 失敗不重試次
            }
        }
    })
    app.use(VueQueryPlugin, {queryClient})
    app.use(ElementPlus)
    app.mount(`#${CONTAINER_ID}`)
}

export default Module