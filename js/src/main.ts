import {createApp, ref} from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const form = document.getElementById("mainform");

if (!form) {
    throw new Error("Form#mainform not found");
}

// 刪除預設的元素
form.querySelectorAll("h1, .notice, #message, .submit").forEach(
    (el) => el.remove()
)

// 添加 div 容器
const CONTAINER_ID = "power-checkout-wc-setting-app";
const div = document.createElement("div");
div.id = CONTAINER_ID;
form.appendChild(div);


// Mount Vue app
const app = createApp(App)
app.use(ElementPlus)
app.mount(`#${CONTAINER_ID}`)
