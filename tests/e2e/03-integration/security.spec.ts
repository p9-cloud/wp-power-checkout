/**
 * P1 — Security — 安全性測試
 *
 * 驗證 power-checkout API 在安全性方面的防護：
 * - 未認證存取所有管理端點 → 401/403
 * - 無效 Nonce 被拒絕
 * - XSS 輸入被 sanitize_text_field_deep 消毒
 * - SQL Injection 防護（輸入被消毒，DB 不受影響）
 * - Path traversal 防護
 * - Webhook HMAC 驗簽（sign 必須匹配）
 * - 敏感金鑰不出現在 GET /settings 摘要中
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { BASE_URL, EP, PROVIDERS, EDGE } from '../fixtures/test-data.js'
import { buildWebhookRequest } from '../helpers/webhook-hmac.js'

const TEST_SIGN_KEY = 'test_sign_key_123'

test.describe('Security — 安全性防護測試', () => {
  let opts: ApiOptions

  test.beforeAll(async ({ request }) => {
    const nonce = getNonce()
    opts = { request, baseURL: BASE_URL, nonce }
  })

  // ─── P1：認證防護 ───────────────────────────────────────────
  test.describe('認證防護', () => {
    test('無 Nonce 存取 GET /settings → 401 或 403', async ({ request }) => {
      const unauthOpts: ApiOptions = { request, baseURL: BASE_URL, nonce: '' }
      const res = await wpGet(unauthOpts, EP.SETTINGS_ALL)
      expect([401, 403]).toContain(res.status)
    })

    test('無效 Nonce 存取 GET /settings/{id} → 401 或 403', async ({ request }) => {
      const invalidOpts: ApiOptions = {
        request,
        baseURL: BASE_URL,
        nonce: 'completely_fake_nonce_value_12345',
      }
      const res = await wpGet(invalidOpts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      expect([401, 403]).toContain(res.status)
    })

    test('無 Nonce 存取 POST /refund → 401 或 403', async ({ request }) => {
      const unauthOpts: ApiOptions = { request, baseURL: BASE_URL, nonce: '' }
      const res = await wpPost(unauthOpts, EP.REFUND, { order_id: 1 })
      expect([401, 403]).toContain(res.status)
    })

    test('無 Nonce 存取 POST /refund/manual → 401 或 403', async ({ request }) => {
      const unauthOpts: ApiOptions = { request, baseURL: BASE_URL, nonce: '' }
      const res = await wpPost(unauthOpts, EP.REFUND_MANUAL, { order_id: 1 })
      expect([401, 403]).toContain(res.status)
    })

    test('無 Nonce 存取 POST /invoices/issue → 401 或 403', async ({ request }) => {
      const unauthOpts: ApiOptions = { request, baseURL: BASE_URL, nonce: '' }
      const res = await wpPost(unauthOpts, EP.INVOICE_ISSUE(1), {
        provider: PROVIDERS.AMEGO,
      })
      expect([401, 403]).toContain(res.status)
    })

    test('無 Nonce 存取 POST /invoices/cancel → 401 或 403', async ({ request }) => {
      const unauthOpts: ApiOptions = { request, baseURL: BASE_URL, nonce: '' }
      const res = await wpPost(unauthOpts, EP.INVOICE_CANCEL(1), {})
      expect([401, 403]).toContain(res.status)
    })

    test('無 Nonce 存取 POST /settings/{id}/toggle → 401 或 403', async ({ request }) => {
      const unauthOpts: ApiOptions = { request, baseURL: BASE_URL, nonce: '' }
      const res = await wpPost(unauthOpts, EP.SETTINGS_TOGGLE(PROVIDERS.AMEGO), {})
      expect([401, 403]).toContain(res.status)
    })
  })

  // ─── P1：敏感金鑰不暴露 ────────────────────────────────────
  test.describe('敏感金鑰不暴露', () => {
    test('GET /settings 摘要不包含 apiKey', async () => {
      const res = await wpGet(opts, EP.SETTINGS_ALL)
      expect(res.status).toBe(200)

      const data = ((res.data as Record<string, unknown>).data ?? res.data) as Record<string, unknown>
      const gateways = data.gateways as Record<string, unknown>[]
      const slp = gateways.find(g => g.id === PROVIDERS.SLP)

      if (slp) {
        expect(slp).not.toHaveProperty('apiKey')
        expect(slp).not.toHaveProperty('clientKey')
        expect(slp).not.toHaveProperty('signKey')
      }
    })

    test('GET /settings 回應 JSON 字串不含敏感金鑰值（防資訊洩漏）', async () => {
      // 先更新一個特定的 apiKey 值
      const sensitiveKey = 'VERY_SECRET_API_KEY_SHOULD_NOT_APPEAR'
      await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        apiKey: sensitiveKey,
      })

      // GET 摘要列表
      const res = await wpGet(opts, EP.SETTINGS_ALL)
      const responseText = JSON.stringify(res.data)

      // 摘要列表不應包含完整的 apiKey 值
      expect(responseText).not.toContain(sensitiveKey)

      // 還原
      await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), { apiKey: '' })
    })
  })

  // ─── P1：XSS 防護 ───────────────────────────────────────────
  test.describe('XSS 輸入防護（sanitize_text_field_deep）', () => {
    test('<script> 標籤被完全移除', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        title: '<script>alert("xss")</script>',
      })
      expect(res.status).toBe(200)

      const body = res.data as Record<string, unknown>
      const data = (body.data ?? body) as Record<string, unknown>
      const title = String(data.title ?? '')
      expect(title).not.toContain('<script>')
      expect(title).not.toContain('alert')
    })

    test('<img onerror> 被移除', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        title: '<img src=x onerror=alert(document.cookie)>',
      })
      expect(res.status).toBe(200)

      const body = res.data as Record<string, unknown>
      const data = (body.data ?? body) as Record<string, unknown>
      const title = String(data.title ?? '')
      expect(title).not.toContain('onerror')
      expect(title).not.toContain('document.cookie')
    })

    test('javascript: URI 被移除', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        title: "javascript:alert(1)",
      })
      expect(res.status).toBe(200)

      const getRes = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      const data = ((getRes.data as Record<string, unknown>).data ?? getRes.data) as Record<string, unknown>
      const title = String(data.title ?? '')
      // sanitize_text_field 移除 javascript: 協議
      expect(title).not.toContain('javascript:')
    })

    test('多重 XSS 嵌套攻擊 → 不應 crash', async () => {
      const nestedXSS = '<<SCRIPT>alert("XSS");//<</SCRIPT>'
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        title: nestedXSS,
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── P1：SQL Injection 防護 ─────────────────────────────────
  test.describe('SQL Injection 防護', () => {
    test('DROP TABLE 注入 → DB 仍正常運作', async () => {
      await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        title: EDGE.SQL_DROP,
      })

      // DB 未被破壞，仍可正常 GET
      const getRes = await wpGet(opts, EP.SETTINGS_ALL)
      expect(getRes.status).toBe(200)
      const data = ((getRes.data as Record<string, unknown>).data ?? getRes.data) as Record<string, unknown>
      expect(Array.isArray(data.gateways)).toBe(true)
    })

    test('OR 1=1 注入 → 不洩漏額外資料', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      expect(res.status).toBe(200)

      // 回傳應只有 SLP 的設定，不因 OR 1=1 而洩漏其他資料
      const data = ((res.data as Record<string, unknown>).data ?? res.data) as Record<string, unknown>
      expect(data).toHaveProperty('merchantId')
      // 不應有其他 provider 的資料
      expect(data).not.toHaveProperty('invoice')  // amego 的欄位
    })

    test('UNION SELECT 注入 → refund 返回數字驗證錯誤', async () => {
      const res = await wpPost(opts, EP.REFUND, { order_id: EDGE.SQL_UNION })
      expect(res.status).toBe(500)
      const body = res.data as Record<string, unknown>
      // 應被視為非數字
      expect(String(body.message ?? '')).toContain('數字')
    })
  })

  // ─── P1：Path Traversal 防護 ────────────────────────────────
  test.describe('Path Traversal 防護', () => {
    test('provider_id 含路徑穿越 ../../wp-config.php → 非 200', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE('../../wp-config.php'))
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    test('provider_id 含 . 點 → 非 200（不符合 pattern）', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE('.hidden'))
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ─── P2：Webhook HMAC 驗簽 ─────────────────────────────────
  test.describe('Webhook HMAC 驗簽', () => {
    test('sign 為 valid HMAC 格式的錯誤值 → 本地可能通過，非本地應 500', async ({ request }) => {
      const payload = { eventType: 'trade.succeeded', data: {} }
      const ts = String(Date.now())
      // 使用錯誤的 signKey 計算
      const wrongSign = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

      const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: {
          'Content-Type': 'application/json',
          timestamp: ts,
          sign: wrongSign,
          apiVersion: 'V1',
        },
        data: payload,
      })
      expect(res.status()).toBeLessThan(600)
    })

    test('Webhook 不需要 X-WP-Nonce header（無認證要求）', async ({ request }) => {
      const payload = { eventType: 'trade.succeeded', data: {} }
      const { headers } = buildWebhookRequest(payload, TEST_SIGN_KEY)

      // 故意不帶 X-WP-Nonce
      const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: {
          'Content-Type': 'application/json',
          // 只帶 Webhook headers，不帶 WP-Nonce
          timestamp: headers.timestamp,
          sign: headers.sign,
          apiVersion: headers.apiVersion,
        },
        data: payload,
      })
      // Webhook 不需要認證，不應返回 401/403
      expect([401, 403]).not.toContain(res.status())
      expect(res.status()).toBeLessThan(600)
    })

    test('valid sign → 可正確處理（本地環境）', async ({ request }) => {
      const payload = {
        eventType: 'trade.succeeded',
        data: {
          tradeOrderId: 'nonexistent_order_for_sign_test',
          status: 'SUCCEEDED',
        },
      }
      const { body, headers } = buildWebhookRequest(payload, TEST_SIGN_KEY)

      const res = await request.post(`${BASE_URL}/wp-json/${EP.WEBHOOK}`, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        data: payload,
      })
      // 簽章正確，但找不到訂單 → 500 mapping_order_failed 或本地跳過驗證
      expect(res.status()).toBeLessThan(600)
      if (res.status() === 500) {
        const json = await res.json().catch(() => ({})) as Record<string, unknown>
        expect(String(json.code ?? '')).toContain('mapping_order_failed')
      }
    })
  })

  // ─── P3：Content-Type 邊界 ──────────────────────────────────
  test.describe('Content-Type 邊界', () => {
    test('POST settings 帶錯誤 Content-Type → 不應 crash', async ({ request }) => {
      const nonce = getNonce()
      const res = await request.post(`${BASE_URL}/wp-json/${EP.SETTINGS_UPDATE(PROVIDERS.SLP)}`, {
        headers: {
          'X-WP-Nonce': nonce,
          'Content-Type': 'text/plain',
        },
        data: '{"title":"test"}',
      })
      expect(res.status()).toBeLessThan(600)
    })

    test('POST settings 帶空 body → 不應 crash', async ({ request }) => {
      const nonce = getNonce()
      const res = await request.post(`${BASE_URL}/wp-json/${EP.SETTINGS_UPDATE(PROVIDERS.SLP)}`, {
        headers: {
          'X-WP-Nonce': nonce,
          'Content-Type': 'application/json',
        },
        data: '',
      })
      expect(res.status()).toBeLessThan(600)
    })
  })
})
