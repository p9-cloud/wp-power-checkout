# Power Checkout - Project Overview

## Purpose
Power Checkout is a WooCommerce checkout integration plugin providing payment gateway (Shopline Payment), e-invoice (Amego), and checkout field customization. Built with Domain-Driven Design: PHP backend + Vue 3 frontend.

## Integrated Services
- **Shopline Payment (SLP)** — Redirect-based payment (credit card, ATM, Apple Pay, LINE Pay, JKOPay, ZingalaCard)
- **Amego** — Taiwan e-invoice issuance/void
- **Checkout Fields** — Classic checkout custom fields (including invoice info fields)

## Tech Stack
- **Backend**: PHP 8.1+, WordPress, WooCommerce (HPOS compatible)
- **Main Frontend**: Vue 3 + Element Plus + TanStack Vue Query + Vue Router 4 (hash mode)
- **WC Blocks Frontend**: React 18 + TypeScript (ONLY for WC Block Checkout payment method registration)
- **Build**: Vite (dual pipeline — one for Vue main app, one for React blocks)
- **Dependencies**: Powerhouse (core plugin), WooCommerce, j7-dev/wp-utils

## Codebase Structure
- `plugin.php` - Entry point, Plugin class with SingletonTrait
- `inc/classes/` - PHP backend (PSR-4 autoload under `J7\PowerCheckout`)
  - `Bootstrap.php` - Wires all domains, checks Powerhouse compatibility
  - `Domains/Payment/` - Payment gateways (ShoplinePayment active, EcpayAIO dormant)
  - `Domains/Invoice/` - Invoice providers (Amego active)
  - `Domains/Settings/` - WC settings tab + REST /settings CRUD
  - `Shared/Utils/ProviderUtils.php` - Provider container + WC options CRUD (central)
  - `Shared/Utils/OrderUtils.php` - HPOS-aware order utilities
  - `Shared/DTOs/BaseSettingsDTO.php` - Base for all provider settings DTOs
- `js/src/` - Vue 3 main app (Settings SPA + RefundDialog + InvoiceApp, 3 instances from 1 bundle)
  - Entry: `js/src/index.ts` — mounts `#power-checkout-wc-setting-app`, plus `MountRefundDialog()` / `MountInvoiceApp()`
  - `pages/` - Settings pages per provider domain
  - `api/` - Axios client with nonce + ElNotification interceptor
  - `external/` - Standalone mini-apps (RefundDialog, InvoiceApp)
- `inc/assets/blocks/` - React WC Blocks entry points (each `.tsx` is a separate Vite entry)
- `inc/tests/` - PHPUnit tests (mirrors `inc/classes/` structure)
- `tests/e2e/` - Playwright E2E (admin/frontend/integration suites, own package.json)
- `specs/` - AIBDD specifications (es.md, api.yml, erm.dbml, features/, actors/, ui/, activities/, clarify/, open-issue/)

## Key Domain Concepts
1. **Provider System**: Payment & Invoice providers registered in `ProviderRegister` static arrays, enabled state in WC options `woocommerce_{id}_settings`, only enabled ones instantiated into `ProviderUtils::$container`
2. **Shopline Payment Flow**: `process_payment()` → create session → redirect to SLP → webhook (HMAC-SHA256) → `StatusManager` updates order status
3. **Invoice Lifecycle**: Auto issue/void via `woocommerce_order_status_{status}` hooks, manual via REST `/invoices/issue/{order_id}` + `/invoices/cancel/{order_id}`
4. **PHP → JS Bridge**: Three `wp_localize_script` objects (`power_checkout_data.env`, `power_checkout_order_data`, `power_checkout_invoice_metabox_app_data`), accessed via `utils/env.ts`
5. **HPOS Compatibility**: `OrderUtils::is_order_detail($hook)` + MetaBox on both `shop_order` and `woocommerce_page_wc-orders`
6. **Refund Support by Payment Method**: Credit Card/LINE Pay (partial+full), Apple Pay/ZingalaCard (full only), ATM (none)

## REST API
- Namespace: `power-checkout/v1` (settings, refund, invoices)
- Webhook: `power-checkout/slp/webhook` (HMAC-SHA256 auth)
- Nonce auth requires `X-WP-Nonce` header
- Response format: `['code' => string, 'message' => string, 'data' => mixed]`
