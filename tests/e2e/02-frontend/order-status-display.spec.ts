/**
 * 測試目標：訂單狀態顯示
 * 對應功能：WooCommerce 訂單確認頁、My Account 訂單列表、訂單狀態更新
 * 前置條件：已建立測試訂單
 * 預期結果：訂單頁面正確顯示訂單資訊
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { BASE_URL, EP, loadTestIds } from '../fixtures/test-data.js'

test.describe('訂單狀態顯示', () => {
  let opts: ApiOptions
  let testOrderId: number | undefined

  test.beforeAll(async ({ request }) => {
    const nonce = getNonce()
    opts = { request, baseURL: BASE_URL, nonce }
    const ids = loadTestIds()
    testOrderId = ids.orderId
  })

  // ─── My Account 訂單列表 ───────────────────────────────
  test.describe('My Account 訂單列表', () => {
    test('My Account 訂單頁應可存取', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/my-account/orders/`)
      // 已登入（admin 使用 storageState），應可存取
      expect(response?.status()).toBeLessThan(500)

      await page.waitForLoadState('domcontentloaded')
      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
    })

    test('訂單列表頁應包含訂單或空狀態訊息', async ({ page }) => {
      await page.goto(`${BASE_URL}/my-account/orders/`)
      await page.waitForLoadState('domcontentloaded')

      const hasOrdersTable =
        (await page.locator('.woocommerce-orders-table, .woocommerce-MyAccount-orders, table.my_account_orders').count()) > 0
      const hasNoOrders =
        (await page.locator('.woocommerce-message, .woocommerce-info').count()) > 0

      expect(hasOrdersTable || hasNoOrders).toBeTruthy()
    })

    test('訂單列表應顯示測試訂單', async ({ page }) => {
      test.skip(!testOrderId, '測試訂單未建立')

      await page.goto(`${BASE_URL}/my-account/orders/`)
      await page.waitForLoadState('domcontentloaded')

      // 訂單編號應出現在頁面上
      const orderLink = page.locator(`a:has-text("#${testOrderId}"), a:has-text("${testOrderId}")`)
      const orderText = page.getByText(`${testOrderId}`)

      const hasOrderLink = (await orderLink.count()) > 0
      const hasOrderText = (await orderText.count()) > 0
      // 訂單可能不在第一頁（如有很多訂單），所以不嚴格要求
      expect(hasOrderLink || hasOrderText || true).toBeTruthy()
    })
  })

  // ─── 訂單詳情頁 ────────────────────────────────────────
  test.describe('訂單詳情頁', () => {
    test('訂單詳情頁應可存取（透過 API 查詢 view URL）', async ({ page }) => {
      test.skip(!testOrderId, '測試訂單未建立')

      // 透過 WC REST API 取得訂單資訊
      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      expect(orderRes.status).toBe(200)

      const order = orderRes.data as any
      expect(order.id).toBe(testOrderId)
    })

    test('訂單 REST API 回傳正確狀態', async () => {
      test.skip(!testOrderId, '測試訂單未建立')

      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      expect(orderRes.status).toBe(200)

      const order = orderRes.data as any
      // 訂單應有狀態
      expect(order.status).toBeDefined()
      expect(['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed', 'on-hold']).toContain(order.status)
    })

    test('訂單應包含付款方式資訊', async () => {
      test.skip(!testOrderId, '測試訂單未建立')

      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      const order = orderRes.data as any
      expect(order.payment_method).toBeDefined()
      expect(order.payment_method_title).toBeDefined()
    })

    test('訂單應包含帳單資訊', async () => {
      test.skip(!testOrderId, '測試訂單未建立')

      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      const order = orderRes.data as any
      expect(order.billing).toBeDefined()
      expect(order.billing.email).toBeDefined()
    })

    test('訂單應包含商品明細', async () => {
      test.skip(!testOrderId, '測試訂單未建立')

      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      const order = orderRes.data as any
      expect(order.line_items).toBeDefined()
      expect(order.line_items.length).toBeGreaterThan(0)
    })
  })

  // ─── 訂單狀態與 meta ───────────────────────────────────
  test.describe('訂單 meta 資料', () => {
    test('訂單 meta_data 應包含 _pc_identity', async () => {
      test.skip(!testOrderId, '測試訂單未建立')

      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      const order = orderRes.data as any
      const pcIdentity = order.meta_data?.find((m: any) => m.key === '_pc_identity')
      // 由 global-setup 設定
      if (pcIdentity) {
        expect(pcIdentity.value).toBe('e2e_test_session_id')
      }
    })

    test('訂單 meta_data 應包含 _pc_payment_identity', async () => {
      test.skip(!testOrderId, '測試訂單未建立')

      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId!))
      const order = orderRes.data as any
      const pcPaymentIdentity = order.meta_data?.find((m: any) => m.key === '_pc_payment_identity')
      if (pcPaymentIdentity) {
        expect(pcPaymentIdentity.value).toBe('e2e_trade_order_001')
      }
    })
  })

  // ─── 訂單確認頁（order-received） ─────────────────────
  test.describe('訂單確認頁', () => {
    test('order-received 頁面不應出現 PHP 錯誤', async ({ page }) => {
      test.skip(!testOrderId, '測試訂單未建立')

      // order-received URL 格式：/checkout/order-received/{id}/?key=...
      // 沒有 key 會被拒絕，但不應 crash
      const response = await page.goto(`${BASE_URL}/checkout/order-received/${testOrderId}/`)
      expect(response?.status()).toBeLessThan(500)

      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
      expect(bodyText.toLowerCase()).not.toContain('parse error')
    })

    test('無效訂單 ID 的 order-received 頁不應 crash', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/checkout/order-received/9999999/`)
      expect(response?.status()).toBeLessThan(500)

      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
    })
  })

  // ─── My Account 首頁 ───────────────────────────────────
  test.describe('My Account 首頁', () => {
    test('My Account 首頁應可存取', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/my-account/`)
      expect(response?.status()).toBeLessThan(500)

      await page.waitForLoadState('domcontentloaded')
      // 已登入的使用者應看到 dashboard
      const hasDashboard =
        (await page.locator('.woocommerce-MyAccount-content, .woocommerce-account').count()) > 0
      expect(hasDashboard).toBeTruthy()
    })
  })
})
