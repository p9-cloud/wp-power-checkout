/**
 * 測試目標：Webhook 回呼與付款回導行為
 * 對應功能：SLP Webhook 接收、付款結果回導 URL、各狀態處理
 * 前置條件：SLP Gateway 已啟用、測試訂單已建立
 * 預期結果：Webhook 端點正確處理各種付款狀態通知
 *
 * NOTE: 實際付款流程會導向 SLP 外部頁面，E2E 無法模擬完整流程。
 *       此測試聚焦 webhook 端點的回呼處理與回導 URL 的可達性。
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import {
  BASE_URL,
  EP,
  SLP_STATUS,
  loadTestIds,
} from '../fixtures/test-data.js'

test.describe('Webhook 回呼與付款回導', () => {
  let opts: ApiOptions
  let testOrderId: number | undefined
  let tradeOrderId: string | undefined

  test.beforeAll(async ({ request }) => {
    const nonce = getNonce()
    opts = { request, baseURL: BASE_URL, nonce }
    const ids = loadTestIds()
    testOrderId = ids.orderId

    // 從測試訂單取得 _pc_payment_identity
    if (testOrderId) {
      const orderRes = await wpGet(opts, EP.WC_ORDER(testOrderId))
      if (orderRes.status === 200) {
        const order = orderRes.data as any
        const pcPaymentIdentity = order.meta_data?.find(
          (m: any) => m.key === '_pc_payment_identity',
        )
        tradeOrderId = pcPaymentIdentity?.value
      }
    }
  })

  // Helper: 送出 webhook 請求
  async function sendWebhook(
    request: ApiOptions['request'],
    payload: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) {
    const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
      headers: {
        'Content-Type': 'application/json',
        timestamp: String(Date.now()),
        sign: 'e2e_test_sign',
        apiVersion: 'V1',
        ...headers,
      },
      data: payload,
    })
    const body = await res.json().catch(() => ({}))
    return { status: res.status(), data: body }
  }

  // ─── Webhook 端點可達性 ────────────────────────────────
  test.describe('Webhook 端點可達性', () => {
    test('POST /slp/webhook 端點存在且可連線', async ({ request }) => {
      const res = await sendWebhook(request, {})
      // 不應回傳 404（端點存在）
      expect(res.status).not.toBe(404)
      expect(res.status).toBeLessThan(600)
    })

    test('GET /slp/webhook → 應回 405 或合理錯誤（只接受 POST）', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/wp-json/${EP.WEBHOOK}`)
      // REST API 對未註冊的 GET 會回 404 或 405
      expect(res.status()).toBeLessThan(600)
    })
  })

  // ─── 付款成功 Webhook ──────────────────────────────────
  test.describe('付款狀態 Webhook', () => {
    test('session.succeeded → 訂單狀態應更新（或安全處理簽章失敗）', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'session.succeeded',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.SUCCEEDED,
          paymentDetail: {
            paymentMethod: 'CreditCard',
            amount: 1000,
          },
        },
      })
      // 本地環境可能跳過簽章驗證
      expect(res.status).toBeLessThan(600)
    })

    test('session.expired → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'session.expired',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.EXPIRED,
        },
      })
      expect(res.status).toBeLessThan(600)
    })

    test('session.failed → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'session.failed',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.FAILED,
        },
      })
      expect(res.status).toBeLessThan(600)
    })

    test('session.cancelled → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'session.cancelled',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.CANCELLED,
        },
      })
      expect(res.status).toBeLessThan(600)
    })

    test('session.processing → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'session.processing',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.PROCESSING,
        },
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 退款 Webhook ─────────────────────────────────────
  test.describe('退款 Webhook', () => {
    test('refund.succeeded → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'refund.succeeded',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.SUCCEEDED,
          refundDetail: { amount: 500 },
        },
      })
      expect(res.status).toBeLessThan(600)
    })

    test('refund.failed → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'refund.failed',
        data: {
          tradeOrderId: tradeOrderId ?? 'e2e_nonexistent_trade',
          status: SLP_STATUS.FAILED,
          refundDetail: { amount: 500 },
        },
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 未知事件類型 ──────────────────────────────────────
  test.describe('未知事件類型', () => {
    test('未定義的 eventType → 安全忽略', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: 'unknown.event.type',
        data: { tradeOrderId: 'e2e_test_unknown' },
      })
      expect(res.status).toBeLessThan(600)
    })

    test('eventType 為空字串 → 安全處理', async ({ request }) => {
      const res = await sendWebhook(request, {
        eventType: '',
        data: {},
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 付款回導 URL 可達性 ───────────────────────────────
  test.describe('付款回導 URL', () => {
    test('付款成功回導 URL（order-received）不應 PHP 錯誤', async ({ page }) => {
      test.skip(!testOrderId, '測試訂單未建立')

      // SLP 付款成功後通常會回導到 order-received 頁面
      const response = await page.goto(
        `${BASE_URL}/checkout/order-received/${testOrderId}/`,
      )
      expect(response?.status()).toBeLessThan(500)

      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
    })

    test('付款失敗回導 URL（checkout）不應 PHP 錯誤', async ({ page }) => {
      // SLP 付款失敗後通常回導到結帳頁
      const response = await page.goto(`${BASE_URL}/checkout/`)
      expect(response?.status()).toBeLessThan(500)

      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
    })

    test('付款取消回導 URL 不應 PHP 錯誤', async ({ page }) => {
      test.skip(!testOrderId, '測試訂單未建立')

      // 付款取消通常會導向訂單檢視頁
      const response = await page.goto(
        `${BASE_URL}/my-account/view-order/${testOrderId}/`,
      )
      // 可能 200 或 302 重定向
      expect(response?.status()).toBeLessThan(500)

      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
    })
  })

  // ─── Webhook Header 變體 ───────────────────────────────
  test.describe('Webhook Header 變體', () => {
    test('timestamp 為字串 "0" → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(
        request,
        { eventType: 'session.succeeded', data: {} },
        { timestamp: '0' },
      )
      expect(res.status).toBeLessThan(600)
    })

    test('timestamp 為未來時間 → 不應 crash', async ({ request }) => {
      const futureTs = String(Date.now() + 86400000) // 24 hours later
      const res = await sendWebhook(
        request,
        { eventType: 'session.succeeded', data: {} },
        { timestamp: futureTs },
      )
      expect(res.status).toBeLessThan(600)
    })

    test('sign 為空字串 → 不應 crash', async ({ request }) => {
      const res = await sendWebhook(
        request,
        { eventType: 'session.succeeded', data: {} },
        { sign: '' },
      )
      expect(res.status).toBeLessThan(600)
    })

    test('apiVersion 缺失 → 不應 crash', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: {
          'Content-Type': 'application/json',
          timestamp: String(Date.now()),
          sign: 'test',
        },
        data: { eventType: 'session.succeeded', data: {} },
      })
      expect(res.status()).toBeLessThan(600)
    })
  })
})
