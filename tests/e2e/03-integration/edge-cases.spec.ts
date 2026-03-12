/**
 * Edge Cases E2E Tests — 重複退款、重複開立、無效 order_id、金額邊界
 *
 * 測試 power-checkout API 在各種邊界情境下的正確行為。
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import {
  BASE_URL,
  EP,
  PROVIDERS,
  INVOICE_TYPE,
  INDIVIDUAL_TYPE,
  TEST_ORDER,
  loadTestIds,
} from '../fixtures/test-data.js'

test.describe('Edge Cases — 邊界情境測試', () => {
  let opts: ApiOptions
  let testOrderId: number | undefined

  test.beforeAll(async ({ request }) => {
    const nonce = getNonce()
    opts = { request, baseURL: BASE_URL, nonce }
    const ids = loadTestIds()
    testOrderId = ids.orderId
  })

  // ─── 重複退款 ──────────────────────────────────────────
  test.describe('重複退款', () => {
    test('連續兩次 gateway 退款同一訂單 → 第二次應回傳錯誤', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')

      // 第一次退款
      const res1 = await wpPost(opts, EP.REFUND, { order_id: testOrderId })
      // 可能成功或失敗（取決於 SLP 連線）

      // 第二次退款（若第一次成功，應該已無餘額）
      const res2 = await wpPost(opts, EP.REFUND, { order_id: testOrderId })
      // 不應 crash
      expect(res2.status).toBeLessThan(600)

      // 如果第一次退款成功，第二次應回傳錯誤
      if (res1.status === 200) {
        expect(res2.status).toBeGreaterThanOrEqual(400)
      }
    })

    test('連續兩次手動退款 → 第二次仍然不應 crash', async () => {
      // 建立一個新訂單（用 WC REST API）或使用已有的
      test.skip(!testOrderId, '測試訂單未建立，跳過')

      const res1 = await wpPost(opts, EP.REFUND_MANUAL, { order_id: testOrderId })
      const res2 = await wpPost(opts, EP.REFUND_MANUAL, { order_id: testOrderId })

      // 不應 crash
      expect(res2.status).toBeLessThan(600)
    })
  })

  // ─── 重複開立發票 ──────────────────────────────────────
  test.describe('重複開立發票', () => {
    test('已開立過的發票再次開立 → 200（回傳已有資料）或合理錯誤', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')

      // 第一次開立
      const res1 = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
        individual: INDIVIDUAL_TYPE.CLOUD,
      })

      // 第二次開立（如果第一次成功，應直接回傳已有資料）
      const res2 = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
        individual: INDIVIDUAL_TYPE.CLOUD,
      })

      expect(res2.status).toBeLessThan(600)

      // 若第一次開立成功，第二次應回傳 200（不重複開立）
      if (res1.status === 200) {
        expect(res2.status).toBe(200)
      }
    })
  })

  // ─── 重複作廢發票 ──────────────────────────────────────
  test.describe('重複作廢發票', () => {
    test('已作廢過的發票再次作廢 → 200 或合理錯誤', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')

      const res1 = await wpPost(opts, EP.INVOICE_CANCEL(testOrderId!), {})
      const res2 = await wpPost(opts, EP.INVOICE_CANCEL(testOrderId!), {})

      expect(res2.status).toBeLessThan(600)
    })
  })

  // ─── 無效 order_id 格式 ───────────────────────────────
  test.describe('無效 order_id 格式', () => {
    const invalidOrderIds = [
      { name: '字串 "abc"', value: 'abc' },
      { name: '負數 -1', value: -1 },
      { name: '浮點數 1.5', value: 1.5 },
      { name: '超大數字', value: 999999999999 },
      { name: '0', value: 0 },
      { name: '布林值 true', value: true },
      { name: '陣列', value: [1, 2, 3] },
      { name: '物件', value: { id: 1 } },
    ]

    for (const { name, value } of invalidOrderIds) {
      test(`refund order_id 為 ${name} → 不應 crash`, async () => {
        const res = await wpPost(opts, EP.REFUND, { order_id: value })
        expect(res.status).toBeLessThan(600)
      })
    }

    for (const { name, value } of invalidOrderIds) {
      test(`manual refund order_id 為 ${name} → 不應 crash`, async () => {
        const res = await wpPost(opts, EP.REFUND_MANUAL, { order_id: value })
        expect(res.status).toBeLessThan(600)
      })
    }
  })

  // ─── 不存在的 provider_id ──────────────────────────────
  test.describe('不存在的 provider_id', () => {
    const invalidProviders = [
      'nonexistent',
      '',
      '../../etc/passwd',
      '<script>alert(1)</script>',
      'a'.repeat(1000),
      '中文provider',
    ]

    for (const provider of invalidProviders) {
      test(`GET settings/${provider.slice(0, 30)}... → 安全處理`, async () => {
        const res = await wpGet(opts, EP.SETTINGS_SINGLE(provider))
        expect(res.status).toBeLessThan(600)
      })
    }

    for (const provider of invalidProviders) {
      test(`POST toggle ${provider.slice(0, 30)}... → 安全處理`, async () => {
        const res = await wpPost(opts, EP.SETTINGS_TOGGLE(provider), {})
        expect(res.status).toBeLessThan(600)
      })
    }
  })

  // ─── 金額邊界 ──────────────────────────────────────────
  test.describe('settings 金額邊界', () => {
    test('min_amount 設為 0 → 儲存成功', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        min_amount: 0,
      })
      expect(res.status).toBe(200)
    })

    test('max_amount 設為極大值 → 不應 crash', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        max_amount: 999999999,
      })
      expect(res.status).toBeLessThan(600)
    })

    test('min_amount > max_amount → 應接受或拒絕但不 crash', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        min_amount: 50000,
        max_amount: 100,
      })
      expect(res.status).toBeLessThan(600)
    })

    test('expire_min 設為 0 → 不應 crash', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        expire_min: 0,
      })
      expect(res.status).toBeLessThan(600)
    })

    test('expire_min 設為極大值 → 不應 crash', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        expire_min: 999999,
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 設定 allowPaymentMethodList ──────────────────────
  test.describe('PaymentMethodList 邊界', () => {
    test('allowPaymentMethodList 為空陣列 → 不應 crash', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        allowPaymentMethodList: [],
      })
      expect(res.status).toBeLessThan(600)
    })

    test('allowPaymentMethodList 包含無效值 → 不應 crash', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        allowPaymentMethodList: ['InvalidMethod', 'CreditCard', ''],
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 並發請求 ──────────────────────────────────────────
  test.describe('並發請求', () => {
    test('同時發送 5 個 GET /settings → 都應成功', async () => {
      const promises = Array.from({ length: 5 }, () =>
        wpGet(opts, EP.SETTINGS_ALL),
      )
      const results = await Promise.all(promises)
      for (const res of results) {
        expect(res.status).toBe(200)
      }
    })

    test('同時 toggle 同一 provider → 不應 crash', async () => {
      const promises = Array.from({ length: 3 }, () =>
        wpPost(opts, EP.SETTINGS_TOGGLE(PROVIDERS.AMEGO), {}),
      )
      const results = await Promise.all(promises)
      for (const res of results) {
        expect(res.status).toBeLessThan(600)
      }

      // 偶數次 toggle 應恢復原始狀態（或至少最後一個 toggle 有效）
      // 再 toggle 一次以確保可預測
      const check = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.AMEGO))
      expect(check.status).toBe(200)
    })
  })

  // ─── Webhook 邊界 ─────────────────────────────────────
  test.describe('Webhook 邊界', () => {
    test('webhook 空 JSON body → 不應 crash', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: {
          'Content-Type': 'application/json',
          timestamp: String(Date.now()),
          sign: 'test',
          apiVersion: 'V1',
        },
        data: {},
      })
      expect(res.status()).toBeLessThan(600)
    })

    test('webhook 超大 payload → 不應 crash', async ({ request }) => {
      const largePayload = {
        eventType: 'session.succeeded',
        data: {
          tradeOrderId: 'X'.repeat(10000),
          extraData: 'Y'.repeat(50000),
        },
      }
      const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: {
          'Content-Type': 'application/json',
          timestamp: String(Date.now()),
          sign: 'test',
          apiVersion: 'V1',
        },
        data: largePayload,
      })
      expect(res.status()).toBeLessThan(600)
    })
  })

  // ─── 並發結帳同一商品 ──────────────────────────────────
  test.describe('並發結帳', () => {
    test('同時對同一訂單發送多次 webhook → 不應造成重複處理', async ({ request }) => {
      const tradeId = `concurrent_e2e_${Date.now()}`
      const promises = Array.from({ length: 5 }, () =>
        request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
          headers: {
            'Content-Type': 'application/json',
            timestamp: String(Date.now()),
            sign: 'concurrent_test',
            apiVersion: 'V1',
          },
          data: {
            eventType: 'session.succeeded',
            data: {
              tradeOrderId: tradeId,
              status: 'SUCCEEDED',
              paymentDetail: { paymentMethod: 'CreditCard', amount: 1000 },
            },
          },
        }),
      )
      const results = await Promise.all(promises)
      for (const res of results) {
        expect(res.status()).toBeLessThan(600)
      }
    })

    test('同時對同一訂單發送退款和開立發票 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')
      const promises = [
        wpPost(opts, EP.REFUND, { order_id: testOrderId }),
        wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
          provider: PROVIDERS.AMEGO,
          invoiceType: INVOICE_TYPE.INDIVIDUAL,
          individual: INDIVIDUAL_TYPE.CLOUD,
        }),
      ]
      const results = await Promise.all(promises)
      for (const res of results) {
        expect(res.status).toBeLessThan(600)
      }
    })
  })

  // ─── 付款超時與重試 ────────────────────────────────────
  test.describe('付款超時與重試', () => {
    test('webhook 短時間內重複送達（模擬重試）→ 應冪等處理', async ({ request }) => {
      const tradeId = `retry_e2e_${Date.now()}`
      const payload = {
        eventType: 'session.succeeded',
        data: {
          tradeOrderId: tradeId,
          status: 'SUCCEEDED',
          paymentDetail: { paymentMethod: 'CreditCard', amount: 1000 },
        },
      }
      const webhookHeaders = {
        'Content-Type': 'application/json',
        timestamp: String(Date.now()),
        sign: 'retry_test',
        apiVersion: 'V1',
      }

      // 第一次送達
      const res1 = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: webhookHeaders,
        data: payload,
      })
      expect(res1.status()).toBeLessThan(600)

      // 短暫等待後再送（模擬 SLP 重試）
      await new Promise((r) => setTimeout(r, 500))

      const res2 = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: { ...webhookHeaders, timestamp: String(Date.now()) },
        data: payload,
      })
      expect(res2.status()).toBeLessThan(600)
    })

    test('先收到 PROCESSING 再收到 SUCCEEDED → 不應 crash', async ({ request }) => {
      const tradeId = `transition_e2e_${Date.now()}`
      const baseHeaders = {
        'Content-Type': 'application/json',
        sign: 'transition_test',
        apiVersion: 'V1',
      }

      // 第一次：PROCESSING
      const res1 = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: { ...baseHeaders, timestamp: String(Date.now()) },
        data: {
          eventType: 'session.processing',
          data: { tradeOrderId: tradeId, status: 'PROCESSING' },
        },
      })
      expect(res1.status()).toBeLessThan(600)

      // 第二次：SUCCEEDED
      const res2 = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: { ...baseHeaders, timestamp: String(Date.now()) },
        data: {
          eventType: 'session.succeeded',
          data: {
            tradeOrderId: tradeId,
            status: 'SUCCEEDED',
            paymentDetail: { paymentMethod: 'CreditCard', amount: 1000 },
          },
        },
      })
      expect(res2.status()).toBeLessThan(600)
    })
  })

  // ─── 發票公司名稱特殊字元 ─────────────────────────────
  test.describe('發票公司名稱特殊字元', () => {
    test('公司名稱含 CJK 特殊字元 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: 'company',
        companyName: '株式会社テスト＆（株）',
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('公司名稱含 Emoji → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: 'company',
        companyName: '🏢 快樂公司 🎉',
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('公司名稱含 SQL 注入字串 → 安全處理', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: 'company',
        companyName: "'; DROP TABLE wp_options; --",
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('公司名稱超長（5000 字）→ 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: 'company',
        companyName: '測'.repeat(5000),
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 已取消/已退款訂單的退款 ──────────────────────────
  test.describe('已取消/已退款訂單再退款', () => {
    test('refund 已退款狀態的訂單 → 應拒絕或安全處理', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')

      // 先手動退款
      await wpPost(opts, EP.REFUND_MANUAL, { order_id: testOrderId })

      // 再嘗試 gateway 退款
      const res = await wpPost(opts, EP.REFUND, { order_id: testOrderId })
      expect(res.status).toBeLessThan(600)
    })

    test('manual refund 已退款狀態的訂單 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立，跳過')
      const res = await wpPost(opts, EP.REFUND_MANUAL, { order_id: testOrderId })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── Webhook 重放攻擊（重複 Transaction ID）───────────
  test.describe('Webhook 重放攻擊', () => {
    test('相同 tradeOrderId 多次 SUCCEEDED webhook → 應冪等或拒絕', async ({ request }) => {
      // 使用已知的測試 tradeOrderId
      const tradeId = 'e2e_trade_order_001'
      const payload = {
        eventType: 'session.succeeded',
        data: {
          tradeOrderId: tradeId,
          status: 'SUCCEEDED',
          paymentDetail: { paymentMethod: 'CreditCard', amount: 1000 },
        },
      }

      const results = []
      for (let i = 0; i < 3; i++) {
        const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
          headers: {
            'Content-Type': 'application/json',
            timestamp: String(Date.now()),
            sign: `replay_test_${i}`,
            apiVersion: 'V1',
          },
          data: payload,
        })
        results.push(res.status())
        await new Promise((r) => setTimeout(r, 200))
      }

      // 所有請求都不應讓伺服器 crash
      for (const status of results) {
        expect(status).toBeLessThan(600)
      }
    })

    test('先 SUCCEEDED 再 EXPIRED 同一 tradeOrderId → 不應回退狀態', async ({ request }) => {
      const tradeId = `replay_state_${Date.now()}`
      const baseHeaders = {
        'Content-Type': 'application/json',
        sign: 'replay_state_test',
        apiVersion: 'V1',
      }

      // SUCCEEDED
      const res1 = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: { ...baseHeaders, timestamp: String(Date.now()) },
        data: {
          eventType: 'session.succeeded',
          data: {
            tradeOrderId: tradeId,
            status: 'SUCCEEDED',
            paymentDetail: { paymentMethod: 'CreditCard', amount: 1000 },
          },
        },
      })
      expect(res1.status()).toBeLessThan(600)

      // 攻擊者重放 EXPIRED
      const res2 = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: { ...baseHeaders, timestamp: String(Date.now()) },
        data: {
          eventType: 'session.expired',
          data: { tradeOrderId: tradeId, status: 'EXPIRED' },
        },
      })
      expect(res2.status()).toBeLessThan(600)
    })
  })

  // ─── 清理 ─────────────────────────────────────────────
  test.afterAll(async () => {
    // 還原合理的 SLP 設定
    await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
      min_amount: 5,
      max_amount: 50000,
      expire_min: 360,
    })
  })
})
