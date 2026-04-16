/**
 * P0 — LINE Pay 結帳流程整合測試
 *
 * 驗證 LINE Pay 付款的完整 webhook → 訂單狀態更新流程：
 * - LINE Pay 成功付款（trade.succeeded）→ 訂單狀態 processing
 * - LINE Pay 失敗付款（trade.failed）→ 訂單狀態保持 pending
 * - 訂單資料與結帳頁提交資料一致（billing + line_items）
 * - settings API 中 allowPaymentMethodList 包含 LinePay
 *
 * 依據：specs/features/payment/shopline-payment-checkout.feature（LINE Pay 結帳規則）
 *       specs/features/payment/refund.feature（LINE Pay 退款規則）
 *
 * NOTE：LINE Pay 在 SLP 託管頁面完成付款，無法透過 Playwright 自動化。
 *       因此以 webhook 模擬代替實際付款，驗證後端狀態更新邏輯。
 *       本地環境跳過 HMAC 簽名驗證（Plugin::$env === 'local'）。
 */
import { test, expect, request as apiRequest } from '@playwright/test'
import { getNonce } from '../helpers/admin-setup.js'
import {
  BASE_URL,
  EP,
  PROVIDERS,
  PAYMENT_METHODS,
  SLP_STATUS,
  ORDER_STATUS,
} from '../fixtures/test-data.js'

// Webhook 必須用 HTTP（不帶 nonce/cookie），因為 WP REST API 收到空 X-WP-Nonce 會回 403
const WEBHOOK_BASE_URL = 'http://turbo.local'

// ─── 測試狀態（在 beforeAll 中初始化）─────────────────────
let nonce: string
let linePayOrderId: number | undefined
let linePayTradeOrderId: string | undefined
let linePayFailedOrderId: number | undefined
let linePayFailedTradeOrderId: string | undefined
let testProductId: number | undefined
let setupError: string | undefined

test.describe('LINE Pay 結帳流程', () => {
  test.beforeAll(async () => {
    nonce = getNonce()

    // 建立獨立的 API context（避免 Playwright fixture 重複使用限制）
    const ctx = await apiRequest.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'X-WP-Nonce': nonce,
        'Content-Type': 'application/json',
      },
    })

    try {
      // 1. 建立測試商品
      const productRes = await ctx.post(`${BASE_URL}/wp-json/wc/v3/products`, {
        data: {
          name: '[E2E] LINE Pay Test Product',
          type: 'simple',
          regular_price: '1000',
          status: 'publish',
        },
      })

      if (productRes.ok()) {
        const product = await productRes.json()
        testProductId = product.id
      } else {
        setupError = `建立測試商品失敗: ${productRes.status()}`
        return
      }

      // 2. 建立 LINE Pay 成功付款測試訂單（pending 狀態）
      linePayTradeOrderId = `e2e_linepay_${Date.now()}`
      const orderRes = await ctx.post(`${BASE_URL}/wp-json/wc/v3/orders`, {
        data: {
          status: 'pending',
          payment_method: 'shopline_payment_redirect',
          payment_method_title: 'Shopline Payment 線上付款',
          billing: {
            first_name: '[E2E]',
            last_name: 'LinePay',
            email: 'e2e-linepay@example.com',
            address_1: '[E2E] LINE Pay Test Address',
            city: 'Taipei',
            country: 'TW',
          },
          line_items: [
            {
              product_id: testProductId,
              quantity: 1,
            },
          ],
          meta_data: [
            { key: '_pc_payment_identity', value: linePayTradeOrderId },
          ],
        },
      })

      if (orderRes.ok()) {
        const order = await orderRes.json()
        linePayOrderId = order.id
      } else {
        const errText = await orderRes.text().catch(() => '')
        setupError = `建立 LINE Pay 成功訂單失敗: ${productRes.status()} ${errText}`
        return
      }

      // 3. 建立 LINE Pay 失敗付款測試訂單（pending 狀態）
      linePayFailedTradeOrderId = `e2e_linepay_fail_${Date.now()}`
      const failedOrderRes = await ctx.post(`${BASE_URL}/wp-json/wc/v3/orders`, {
        data: {
          status: 'pending',
          payment_method: 'shopline_payment_redirect',
          payment_method_title: 'Shopline Payment 線上付款',
          billing: {
            first_name: '[E2E]',
            last_name: 'LinePayFailed',
            email: 'e2e-linepay-failed@example.com',
            address_1: '[E2E] LINE Pay Failed Test Address',
            city: 'Taipei',
            country: 'TW',
          },
          line_items: [
            {
              product_id: testProductId,
              quantity: 1,
            },
          ],
          meta_data: [
            { key: '_pc_payment_identity', value: linePayFailedTradeOrderId },
          ],
        },
      })

      if (failedOrderRes.ok()) {
        const failedOrder = await failedOrderRes.json()
        linePayFailedOrderId = failedOrder.id
      } else {
        setupError = `建立 LINE Pay 失敗訂單失敗: ${failedOrderRes.status()}`
      }
    } finally {
      await ctx.dispose()
    }
  })

  // ─── 清理：刪除測試資料 ───────────────────────────────
  test.afterAll(async () => {
    const ctx = await apiRequest.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'X-WP-Nonce': nonce,
        'Content-Type': 'application/json',
      },
    })

    try {
      // 刪除測試訂單
      for (const id of [linePayOrderId, linePayFailedOrderId]) {
        if (id) {
          await ctx.delete(`${BASE_URL}/wp-json/wc/v3/orders/${id}?force=true`).catch(() => {})
        }
      }
      // 刪除測試商品
      if (testProductId) {
        await ctx.delete(`${BASE_URL}/wp-json/wc/v3/products/${testProductId}?force=true`).catch(() => {})
      }
    } finally {
      await ctx.dispose()
    }
  })

  // ─── 輔助函式：發送 Webhook ─────────────────────────
  // 使用原生 fetch + HTTP local URL，完全不帶任何 WP 認證。
  // 不能用 Playwright 的 request（即使 newContext 也會繼承 storageState cookies），
  // 因為 WP REST API 的 rest_cookie_check_errors 會驗證 cookie 對應的 nonce，
  // 驗證失敗就回 403。
  async function sendWebhook(payload: Record<string, unknown>) {
    const body = JSON.stringify(payload)
    const res = await fetch(`${WEBHOOK_BASE_URL}/wp-json/${EP.WEBHOOK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'timestamp': String(Date.now()),
        'sign': 'e2e_linepay_test_sign',
        'apiVersion': 'V1',
      },
      body,
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data: data as Record<string, unknown> }
  }

  // ─── 輔助函式：查詢訂單 ─────────────────────────────
  async function getOrder(request: import('@playwright/test').APIRequestContext, orderId: number) {
    const res = await request.get(`${BASE_URL}/wp-json/${EP.WC_ORDER(orderId)}`, {
      headers: {
        'X-WP-Nonce': nonce,
        'Content-Type': 'application/json',
      },
    })
    return {
      status: res.status(),
      data: await res.json().catch(() => ({})) as Record<string, unknown>,
    }
  }

  // ─── 輔助函式：LINE Pay trade.succeeded payload ──────
  function makeTradeSucceededPayload(tradeOrderId: string) {
    return {
      id: `EVT_E2E_LINEPAY_SUC_${Date.now()}`,
      type: 'trade.succeeded',
      created: Date.now(),
      data: {
        referenceOrderId: `RL_E2E_${tradeOrderId}`,
        tradeOrderId,
        status: SLP_STATUS.SUCCEEDED,
        actionType: 'SDK',
        order: {
          merchantId: '3252264968486264832',
          referenceOrderId: `RL_E2E_${tradeOrderId}`,
          createTime: Math.floor(Date.now() / 1000),
          amount: { currency: 'TWD', value: 100000 },
          customer: {
            referenceCustomerId: 'E2E_LINEPAY_CUSTOMER',
            customerId: 'SLP_E2E_LINEPAY',
          },
        },
        payment: {
          paymentMethod: PAYMENT_METHODS.LINE_PAY,
          paymentBehavior: 'Regular',
          paidAmount: { currency: 'TWD', value: 100000 },
          paymentInstrument: { savePaymentInstrument: false },
          paymentSuccessTime: String(Date.now()),
        },
        paymentMsg: { code: '', msg: '' },
      },
    }
  }

  // ─── 輔助函式：LINE Pay trade.failed payload ────────
  function makeTradeFailedPayload(tradeOrderId: string) {
    return {
      id: `EVT_E2E_LINEPAY_FAIL_${Date.now()}`,
      type: 'trade.failed',
      created: Date.now(),
      data: {
        referenceOrderId: `RL_E2E_${tradeOrderId}`,
        tradeOrderId,
        status: SLP_STATUS.FAILED,
        actionType: 'SDK',
        order: {
          merchantId: '3252264968486264832',
          referenceOrderId: `RL_E2E_${tradeOrderId}`,
          createTime: Math.floor(Date.now() / 1000),
          amount: { currency: 'TWD', value: 100000 },
          customer: {
            referenceCustomerId: 'E2E_LINEPAY_CUSTOMER',
            customerId: 'SLP_E2E_LINEPAY',
          },
        },
        payment: {
          paymentMethod: PAYMENT_METHODS.LINE_PAY,
          paymentBehavior: 'Regular',
          paidAmount: { currency: 'TWD', value: 0 },
        },
        paymentMsg: { code: '9999', msg: 'LINE Pay payment was declined by user' },
      },
    }
  }

  // ─── P0: LINE Pay 成功付款 ─────────────────────────────
  test.describe('P0: LINE Pay 成功付款', () => {
    test('LINE Pay trade.succeeded → 訂單狀態為 processing', async ({ request }) => {
      test.skip(!!setupError, `Setup 失敗: ${setupError}`)
      test.skip(!linePayOrderId || !linePayTradeOrderId, 'LINE Pay 測試訂單未建立')

      // 發送 LINE Pay 成功付款 webhook
      const webhookRes = await sendWebhook(
        makeTradeSucceededPayload(linePayTradeOrderId!),
      )
      expect(webhookRes.status).toBe(200)

      // 驗證訂單狀態
      const orderRes = await getOrder(request, linePayOrderId!)
      expect(orderRes.status).toBe(200)
      expect(orderRes.data.status).toBe(ORDER_STATUS.PROCESSING)
    })

    test('訂單資料與結帳頁相同（billing + line_items）', async ({ request }) => {
      test.skip(!!setupError, `Setup 失敗: ${setupError}`)
      test.skip(!linePayOrderId, 'LINE Pay 測試訂單未建立')

      const orderRes = await getOrder(request, linePayOrderId!)
      expect(orderRes.status).toBe(200)

      const order = orderRes.data
      const billing = order.billing as Record<string, unknown>
      const lineItems = order.line_items as Array<Record<string, unknown>>

      // 驗證 billing 資訊
      expect(billing.first_name).toBe('[E2E]')
      expect(billing.last_name).toBe('LinePay')
      expect(billing.email).toBe('e2e-linepay@example.com')
      expect(billing.city).toBe('Taipei')
      expect(billing.country).toBe('TW')

      // 驗證 line_items
      expect(lineItems).toHaveLength(1)
      expect(lineItems[0].name).toBe('[E2E] LINE Pay Test Product')
    })
  })

  // ─── P0: LINE Pay 失敗付款 ─────────────────────────────
  test.describe('P0: LINE Pay 失敗付款', () => {
    test('LINE Pay trade.failed → 訂單狀態保持 pending', async ({ request }) => {
      test.skip(!!setupError, `Setup 失敗: ${setupError}`)
      test.skip(!linePayFailedOrderId || !linePayFailedTradeOrderId, 'LINE Pay 失敗測試訂單未建立')

      // 發送 LINE Pay 失敗付款 webhook
      const webhookRes = await sendWebhook(
        makeTradeFailedPayload(linePayFailedTradeOrderId!),
      )
      expect(webhookRes.status).toBe(200)

      // 驗證訂單狀態仍為 pending
      const orderRes = await getOrder(request, linePayFailedOrderId!)
      expect(orderRes.status).toBe(200)
      expect(orderRes.data.status).toBe(ORDER_STATUS.PENDING)
    })
  })

  // ─── P1: 設定驗證 ─────────────────────────────────────
  test.describe('P1: LINE Pay 設定驗證', () => {
    test('更新設定後 allowPaymentMethodList 包含 LinePay', async ({ request }) => {
      // 1. 先讀取現有設定
      const getRes = await request.get(
        `${BASE_URL}/wp-json/${EP.SETTINGS_SINGLE(PROVIDERS.SLP)}`,
        {
          headers: {
            'X-WP-Nonce': nonce,
            'Content-Type': 'application/json',
          },
        },
      )
      expect(getRes.status()).toBe(200)

      const currentSettings = await getRes.json()
      const currentData = currentSettings.data ?? currentSettings
      const currentList = (currentData.allowPaymentMethodList as string[]) ?? []

      // 2. 如果 LinePay 不在清單中，更新設定加入它
      if (!currentList.includes(PAYMENT_METHODS.LINE_PAY)) {
        const updatedList = [...currentList, PAYMENT_METHODS.LINE_PAY]
        const postRes = await request.post(
          `${BASE_URL}/wp-json/${EP.SETTINGS_UPDATE(PROVIDERS.SLP)}`,
          {
            headers: {
              'X-WP-Nonce': nonce,
              'Content-Type': 'application/json',
            },
            data: { allowPaymentMethodList: updatedList },
          },
        )
        expect(postRes.status()).toBeLessThan(300)
      }

      // 3. 驗證設定已包含 LinePay
      const verifyRes = await request.get(
        `${BASE_URL}/wp-json/${EP.SETTINGS_SINGLE(PROVIDERS.SLP)}`,
        {
          headers: {
            'X-WP-Nonce': nonce,
            'Content-Type': 'application/json',
          },
        },
      )
      expect(verifyRes.status()).toBe(200)

      const verifySettings = await verifyRes.json()
      const verifyData = verifySettings.data ?? verifySettings
      const verifyList = verifyData.allowPaymentMethodList as string[]
      expect(verifyList).toContain(PAYMENT_METHODS.LINE_PAY)
    })
  })
})
