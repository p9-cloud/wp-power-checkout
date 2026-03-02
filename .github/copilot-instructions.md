# CLAUDE.md

此檔案為 AI 助理 (Claude Code / GitHub Copilot) 在此專案中工作時的指導文件。

> **Last Updated:** 2025-01-01 | **Version:** 1.0.27

---

## 專案概覽

**Power Checkout** 是一個專為 WooCommerce 設計的結帳整合外掛，整合金流、電子發票功能，並提供結帳欄位擴充。採用 Domain-Driven Design，PHP 後端 + Vue 3 前端架構。

**核心整合服務：**
- **Shopline Payment (SLP)** — 跳轉式金流（信用卡、ATM 虛擬帳號、Apple Pay、LINE Pay、街口支付、中租零卡）
- **Amego 光貿電子發票** — 台灣電子發票開立/作廢
- **Checkout Fields** — 傳統結帳自訂欄位（含發票資訊欄位）

---

## 核心技術架構

### 後端架構
- **PHP 8.1+** 配合 **Composer** 套件管理
- **PSR-4 Autoloading**: 命名空間 `J7\PowerCheckout` → `inc/classes/`
- **WP Utils Framework**: `j7-dev/wp-utils ^0.3` (Mozart 前綴至 `vendor_prefixed/`)
- **WooCommerce 8.3.0+** 必要依賴
- **Powerhouse 外掛 3.3.38+** 選用依賴（有安裝才檢查版本）

### 前端架構（**Vue 3**，非 React）
- **Vue 3** + **TypeScript** + **Vite** (dev port: **5182**)
- **Element Plus** UI 組件庫（非 Ant Design）
- **@tanstack/vue-query** API 狀態管理
- **Vue Router 4** (hash 模式)
- **3 個獨立 Vue App 實例**（從同一個 bundle 建立）

### 專案結構
```
├── plugin.php                   # 外掛入口，Plugin class (Singleton + PluginTrait)
├── inc/classes/                 # PHP 原始碼 (PSR-4: J7\PowerCheckout\)
│   ├── Bootstrap.php            # 初始化所有 Domain
│   ├── Domains/
│   │   ├── Payment/
│   │   │   ├── ProviderRegister.php          # 註冊 WC 金流
│   │   │   ├── ShoplinePayment/
│   │   │   │   ├── Services/RedirectGateway.php  ← WC_Payment_Gateway 實作
│   │   │   │   ├── Http/ApiClient.php            ← SLP API 客戶端
│   │   │   │   ├── Http/WebHook.php              ← SLP Webhook 接收
│   │   │   │   ├── Managers/StatusManager.php    ← SLP 狀態 → WC 訂單狀態
│   │   │   │   └── DTOs/                         ← 設定、交易、Webhook DTOs
│   │   │   └── Shared/
│   │   │       ├── Abstracts/AbstractPaymentGateway.php
│   │   │       ├── Services/PaymentApiService.php  ← REST /refund
│   │   │       └── Helpers/MetaKeys.php
│   │   ├── Invoice/
│   │   │   ├── ProviderRegister.php
│   │   │   ├── Amego/
│   │   │   │   ├── Services/AmegoProvider.php    ← IInvoiceService 實作
│   │   │   │   ├── Http/ApiClient.php
│   │   │   │   └── DTOs/AmegoSettingsDTO.php
│   │   │   └── Shared/
│   │   │       ├── Interfaces/IInvoiceService.php
│   │   │       └── Services/InvoiceApiService.php ← REST /invoices
│   │   └── Settings/
│   │       └── Services/
│   │           ├── SettingTabService.php  ← WC 設定分頁 + script enqueue
│   │           ├── SettingApiService.php  ← REST /settings CRUD
│   │           └── DefaultSetting.php    ← 台灣地址格式修正
│   └── Shared/
│       ├── Utils/ProviderUtils.php     ← Provider 容器 + options CRUD
│       ├── Utils/OrderUtils.php        ← HPOS-aware 訂單工具
│       ├── Utils/CheckoutFields.php    ← 傳統結帳欄位註冊
│       └── DTOs/BaseSettingsDTO.php
├── js/src/                      # Vue 3 前端原始碼
│   ├── index.ts                 # 入口，掛載 3 個 Vue App
│   ├── App.vue                  # 根元件（側邊欄選單 + router-view）
│   ├── router/index.ts          # Hash 模式路由
│   ├── api/index.ts             # Axios 客戶端
│   ├── pages/                   # 設定 SPA 頁面
│   │   ├── Payments/ → /payments, /payments/shopline_payment_redirect
│   │   └── Invoices/ → /invoices, /invoices/amego
│   ├── external/
│   │   ├── RefundDialog/        # 訂單詳情退款 Dialog
│   │   └── InvoiceApp/          # 訂單詳情 + 結帳頁發票 App
│   └── types/global.d.ts        # window.power_checkout_data 等型別宣告
└── js/dist/                     # 建置輸出 (index.js + index.css)
```

---

## 常用開發指令

### 環境設置
```bash
pnpm bootstrap          # pnpm install + composer install
```

### 開發建置
```bash
pnpm dev               # Vite 開發伺服器 (port 5182)
pnpm build             # 建置前端資源到 js/dist/
pnpm preview           # 預覽建置結果
```

### 代碼品質
```bash
pnpm lint              # ESLint (前端)
pnpm lint:fix          # 自動修正前端問題
pnpm format            # Prettier 格式化

composer lint          # PHPCS 檢查
composer test          # PHPUnit (API_MODE=mock)
composer test:sandbox  # PHPUnit (API_MODE=sandbox)
composer test:coverage # PHPUnit + 覆蓋率
```

### 版本發佈
```bash
pnpm release           # 發佈 patch 版本
pnpm release:minor     # 發佈 minor 版本
pnpm release:major     # 發佈 major 版本
pnpm zip               # 建立外掛 zip 檔
pnpm sync:version      # 同步 package.json 版本 → plugin.php
pnpm i18n              # 產生 .pot 翻譯模板
```

---

## PHP 開發規範

- `declare(strict_types=1)` — 每個 PHP 檔案都必須有
- `final class` — 除非需要繼承，否則一律 final（PHPCS 強制）
- **PHP 8.1+ 語法** — enum、readonly、named args、match expression
- **PHPStan level 9** — 所有靜態分析問題必須解決
- **Text domain** — `'power_checkout'`（底線，非連字符）
- **Hook callbacks** — 一律靜態方法 `[__CLASS__, 'method']`
- **例外處理** — catch `\Throwable`，用 `Plugin::logger()` 記錄，不暴露內部錯誤至前端

---

## Vue 3 前端開發規範

- `<script setup lang="ts">` — 組合式 API，禁用選項式 API
- `@/` alias — 所有 import 使用路徑別名，不使用相對路徑
- env 存取 — 透過 `utils/env.ts`，不直接讀 `window`
- `ElNotification` — API 客戶端攔截器自動顯示通知，不要手動重複觸發
- TanStack Vue Query — `staleTime: 15min`、`retry: 0`、`refetchOnWindowFocus: false`
- Element Plus — 只用 Element Plus，不引入其他 UI 套件

---

## REST API 一覽

| 命名空間 | Method | Endpoint | 說明 |
|---|---|---|---|
| `power-checkout/v1` | GET | `/settings` | 取得所有金流/發票設定 |
| `power-checkout/v1` | GET | `/settings/{id}` | 取得單一 provider 設定 |
| `power-checkout/v1` | POST | `/settings/{id}` | 更新 provider 設定 |
| `power-checkout/v1` | POST | `/settings/{id}/toggle` | 開關 provider |
| `power-checkout/v1` | POST | `/refund` | Gateway 退款 |
| `power-checkout/v1` | POST | `/refund/manual` | 手動退款（僅改狀態） |
| `power-checkout/v1/invoices` | POST | `/issue/{order_id}` | 開立電子發票 |
| `power-checkout/v1/invoices` | POST | `/cancel/{order_id}` | 作廢電子發票 |
| `power-checkout/slp` | POST | `/webhook` | Shopline Payment Webhook 接收（無需認證，HMAC 驗簽） |

所有有認證需求的端點需要 `X-WP-Nonce` header（`wp_create_nonce('wp_rest')`）。

---

## PHP → JS 資料橋接

透過 `wp_localize_script` 傳遞 PHP 資料至前端：

```typescript
// SettingTabService — 設定頁/訂單頁都會載入
window.power_checkout_data.env = {
  SITE_URL, API_URL, NONCE, CURRENT_USER_ID, CURRENT_POST_ID,
  APP_NAME, KEBAB, SNAKE, APP1_SELECTOR, IS_LOCAL, ORDER_STATUSES
}

// ProviderRegister — 訂單詳情頁
window.power_checkout_order_data = {
  gateway: { id, method_title },
  order: { id, total, remaining_refund_amount }
}

// ProviderRegister — 發票 App
window.power_checkout_invoice_metabox_app_data = {
  render_ids: string[],
  is_admin: boolean,
  is_issued: boolean,
  invoice_number: string,
  invoice_providers: [...],
  order: { id: string }
}
```

---

## Provider 系統

### 生命週期
1. 在 `ProviderRegister::$xxx_providers` 中列出
2. `ProviderUtils::is_enabled($id)` 讀取 `woocommerce_{id}_settings` option 中的 `enabled` 值
3. 只有已啟用的 provider 才會實例化並放入 `ProviderUtils::$container`

### 常用操作
```php
ProviderUtils::is_enabled('amego');             // bool
ProviderUtils::get_provider('amego');           // IInvoiceService|null
ProviderUtils::toggle('amego');                 // 切換啟用/停用
ProviderUtils::get_option('amego', 'app_key');  // 讀設定值
ProviderUtils::update_option('amego', [...]);   // 寫設定值
```

---

## 重要 WordPress Hooks

| Hook | 用途 |
|---|---|
| `woocommerce_payment_gateways` | 注入 SLP Gateway |
| `woocommerce_settings_tabs_array` | 新增 WC 設定分頁 |
| `before_woocommerce_init` | 宣告 HPOS + Blocks 相容性 |
| `wc_payment_gateways_initialized` | 填充 ProviderUtils::$container |
| `woocommerce_order_status_{status}` | 自動開立/作廢發票 |
| `add_meta_boxes` | 發票 MetaBox（HPOS 相容） |
| `woocommerce_checkout_fields` | 傳統結帳新增發票欄位 |
| `woocommerce_order_refunded` | 退款後記錄 order note |
| `admin_enqueue_scripts` | 載入 Vue App Script |

---

## Shopline Payment 整合重點

### 付款流程
1. `process_payment()` → `before_process_payment()` → `ApiClient::create_session()` → 跳轉至 SLP 頁面
2. SLP 發送 Webhook POST 至 `/wp-json/power-checkout/slp/webhook`
3. Webhook 驗簽 (HMAC-SHA256)：`hash_hmac('sha256', "{timestamp}.{body}", $signKey)`
4. `StatusManager::update_order_status()` 根據 SLP status 更新訂單狀態

### 訂單狀態對應
| SLP status | WC 訂單狀態 |
|---|---|
| SUCCEEDED | processing |
| EXPIRED | cancelled |
| 其他 | pending |

### 退款限制
| 付款方式 | 退款支援 |
|---|---|
| 信用卡 | ✅ 部分/全額 |
| ATM 虛擬帳號 | ❌ 不支援 |
| Apple Pay | ✅ |
| 中租零卡 | ⚠️ 只支援全額退款 |

---

## Order Meta Keys 摘要

| Meta Key | 說明 |
|---|---|
| `pc_payment_identity` | tradeOrderId（防重複處理） |
| `pc_payment_detail` | 付款詳情（顯示在後台） |
| `pc_refund_detail` | 退款詳情 |
| `pc_issued_data` | 發票開立回傳資料 |
| `pc_cancelled_data` | 發票作廢回傳資料 |
| `pc_provider_id` | 使用哪個發票 provider |
| `pc_issue_params` | 結帳頁填寫的發票資訊 |
| `_pc_tax_type` | 商品稅別（發票用） |

---

## HPOS 相容性

- 透過 `OrderUtils::is_order_detail($hook)` 同時支援 HPOS 和傳統訂單頁
- MetaBox 同時註冊 `shop_order` 和 `woocommerce_page_wc-orders`
- 已在 `before_woocommerce_init` 宣告 `custom_order_tables` 相容

---

## 待辦事項 / Roadmap

| 狀態 | 項目 |
|---|---|
| ✅ 已完成 | HPOS 支援 |
| ✅ 已完成 | WooCommerce Blocks 結帳相容性宣告 |
| 🚧 TODO | 區塊結帳自訂欄位（`render_invoice_field_block` 已有 stub） |
| 🚧 TODO | 物流功能（前端路由已有 placeholder） |
| 🚧 TODO | 全域設定頁（前端路由已有 placeholder） |
| 🚧 TODO | ECPay AIO 金流（程式碼存在但已註解） |

---

## 開發工作流程

1. `pnpm bootstrap` — 初始化依賴
2. `pnpm dev` — 啟動前端開發伺服器（port 5182）
3. 後端開發後執行 `composer lint` + `composer test`
4. 前端開發後執行 `pnpm lint`
5. `pnpm build` — 建置前端至 `js/dist/`
6. `pnpm release` — 發佈新版本