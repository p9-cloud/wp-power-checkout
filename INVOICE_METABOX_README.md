# 訂單 MetaBox 實作說明

## 功能概述

在 WooCommerce 訂單後台新增「電子發票資訊」MetaBox，支援：

- ✅ 傳統訂單儲存 (shop_order post type)
- ✅ HPOS (High-Performance Order Storage)

## 已實作的檔案

### 1. InvoiceMetaBoxService.php

路徑：`inc/classes/Domains/Invoice/Shared/Services/InvoiceMetaBoxService.php`

**主要功能：**

- `register_hooks()`: 註冊 WordPress hooks
- `add_invoice_meta_box()`: 新增 MetaBox
- `render_invoice_meta_box()`: 渲染 MetaBox 內容

### 2. Bootstrap.php (已更新)

路徑：`inc/classes/Bootstrap.php`

**更新內容：**

- 在 `__construct()` 中註冊 `InvoiceMetaBoxService::register_hooks()`
- 在 `declare_compatibility()` 中宣告 HPOS 相容性

## 使用的 Hook

### add_meta_boxes

```php
add_action( 'add_meta_boxes', [ __CLASS__, 'add_invoice_meta_box' ] );
```

**為什麼選擇這個 Hook？**

1. ✅ 同時支援傳統訂單和 HPOS
2. ✅ WooCommerce 官方推薦用於新增 MetaBox
3. ✅ 在 WooCommerce 8.0+ 和 HPOS 環境下都能正常工作

## HPOS 相容性處理

### 1. 檢測 HPOS 是否啟用

```php
if ( class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) ) {
    if ( \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() ) {
        // HPOS 已啟用
    }
}
```

### 2. 支援多種 Screen ID

```php
$order_screen_ids = [ 'shop_order' ]; // 傳統
if ( HPOS 已啟用 ) {
    $order_screen_ids[] = wc_get_page_screen_id( 'shop-order' ); // HPOS
}
```

### 3. 取得訂單物件

```php
$order = $post_or_order instanceof \WC_Order 
    ? $post_or_order  // HPOS 直接傳入 WC_Order
    : \wc_get_order( $post_or_order->ID ); // 傳統從 WP_Post 取得
```

### 4. 宣告 HPOS 相容性

```php
\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
    'custom_order_tables',
    'power-checkout\plugin.php',
    true
);
```

## MetaBox 位置和優先級

- **ID**: `power_checkout_invoice_meta_box`
- **位置**: `side` (側邊欄)
- **優先級**: `high` (高優先級，顯示在上方)

可以修改為：

- `normal`: 主要內容區域
- `advanced`: 進階區域
- 優先級: `core`, `default`, `low`

## 測試方式

1. 確保 WooCommerce 已安裝並啟用
2. 前往 WooCommerce > 訂單
3. 開啟或建立一筆訂單
4. 在側邊欄應該會看到「電子發票資訊」MetaBox

### 測試 HPOS 相容性

1. 前往 WooCommerce > 設定 > 進階 > 功能
2. 啟用「高效能訂單儲存」(HPOS)
3. 再次檢查訂單後台，MetaBox 應該仍然正常顯示

## 後續擴充建議

可以在 `render_invoice_meta_box()` 中加入：

- 顯示實際的發票資訊
- 新增發票操作按鈕
- AJAX 功能（如：開立發票、作廢發票等）
- 從訂單 meta 中讀取發票資料

範例：

```php
$invoice_number = $order->get_meta('_invoice_number');
$invoice_date = $order->get_meta('_invoice_date');
```

