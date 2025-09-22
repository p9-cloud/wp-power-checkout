import axios from 'axios';
import {API_URL, NONCE} from '@/utils/env'


const apiClient = axios.create({
    baseURL: `${API_URL}/power-checkout/v1/`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': NONCE,
    },
});

// Request 攔截器
apiClient.interceptors.request.use(
    config => {
        // 例如加上 token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response 攔截器
apiClient.interceptors.response.use(
    // 成功處理
    (response) => {
        return response
    },

    // 錯誤處理
    (error) => {
        if (error.response) {
            // 伺服器有響應但狀態碼表示錯誤
            switch (error.response.status) {
                case 403:
                    const confirm = window.confirm(
                        '\n網站 Cookie 已經過期，請重新整理頁面後才能繼續使用\n\n按 【確認】 ，重新整理頁面\n\n或者按 【取消】 ，您可以手動複製尚未儲存的資料避免頁面刷新後遺失',
                    )
                    if (confirm) {
                        window.location.reload()
                    }
                    break
                default:
                    console.error('請求失敗:', error.response.data.message)
            }
        } else if (error.request) {
            // 請求已發送但沒有收到響應
            console.error('沒有收到伺服器響應')
        } else {
            // 設定請求時發生錯誤
            console.error('請求配置錯誤:', error.message)
        }

        // 返回錯誤
        return Promise.reject(error) // 會被捕獲然後發送通知
    },
);

export default apiClient;
