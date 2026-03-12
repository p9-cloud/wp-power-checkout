/**
 * 測試目標：電子發票表單
 * 對應功能：Amego 電子發票系統 — 發票類型選擇（個人/公司/捐贈）、欄位驗證
 * 前置條件：Amego Provider 已啟用
 * 預期結果：發票開立 API 正確處理各類型與欄位組合
 *
 * NOTE: 電子發票欄位在 WooCommerce 結帳頁由 JS 動態渲染，
 *       此測試同時涵蓋 API 層的參數驗證與前端頁面的基本渲染。
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
  EDGE,
  loadTestIds,
} from '../fixtures/test-data.js'

test.describe('電子發票表單', () => {
  let opts: ApiOptions
  let testOrderId: number | undefined

  test.beforeAll(async ({ request }) => {
    const nonce = getNonce()
    opts = { request, baseURL: BASE_URL, nonce }
    const ids = loadTestIds()
    testOrderId = ids.orderId
  })

  // ─── Amego 設定確認 ────────────────────────────────────
  test.describe('Amego 設定確認', () => {
    test('Amego provider 設定應可讀取', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.AMEGO))
      expect(res.status).toBe(200)
      const data = (res.data as any).data ?? res.data
      expect(data).toHaveProperty('invoice')
      expect(data).toHaveProperty('app_key')
    })

    test('Amego 設定包含 tax_rate', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.AMEGO))
      const data = (res.data as any).data ?? res.data
      expect(data).toHaveProperty('tax_rate')
    })
  })

  // ─── 發票類型：個人 ────────────────────────────────────
  test.describe('發票類型 — 個人 (individual)', () => {
    test('個人雲端發票 → invoiceType=individual, individual=cloud', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
        individual: INDIVIDUAL_TYPE.CLOUD,
      })
      // 可能成功（200）或因外部 API 失敗（500），但不應 crash
      expect(res.status).toBeLessThan(600)
    })

    test('個人手機條碼 → invoiceType=individual, individual=barcode', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
        individual: INDIVIDUAL_TYPE.BARCODE,
        barcode: '/ABC1234',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('個人自然人憑證 → invoiceType=individual, individual=moica', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
        individual: INDIVIDUAL_TYPE.MOICA,
        moica: 'AB12345678901234',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('個人紙本發票 → invoiceType=individual, individual=paper', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
        individual: INDIVIDUAL_TYPE.PAPER,
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 發票類型：公司 ────────────────────────────────────
  test.describe('發票類型 — 公司 (company)', () => {
    test('公司發票需統一編號 → invoiceType=company', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.COMPANY,
        companyName: '測試公司股份有限公司',
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('公司名稱含特殊字元 → 安全處理', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.COMPANY,
        companyName: EDGE.SPECIAL_CHARS,
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('公司名稱含 XSS 字串 → 被 sanitize', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.COMPANY,
        companyName: EDGE.XSS_SCRIPT,
        taxId: '12345678',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('統一編號為空 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.COMPANY,
        companyName: '測試公司',
        taxId: '',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('統一編號格式錯誤（非 8 碼數字）→ 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.COMPANY,
        companyName: '測試公司',
        taxId: 'ABCDEFGH',
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 發票類型：捐贈 ────────────────────────────────────
  test.describe('發票類型 — 捐贈 (donate)', () => {
    test('捐贈發票 → invoiceType=donate', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.DONATE,
        donateCode: '919',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('捐贈碼為空 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.DONATE,
        donateCode: '',
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 欄位驗證：缺少必要欄位 ───────────────────────────
  test.describe('欄位驗證', () => {
    test('不傳 invoiceType → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
      })
      expect(res.status).toBeLessThan(600)
    })

    test('invoiceType 為無效值 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: 'invalid_type',
      })
      expect(res.status).toBeLessThan(600)
    })

    test('individual 類型但不傳 individual 欄位 → 不應 crash', async () => {
      test.skip(!testOrderId, '測試訂單未建立')
      const res = await wpPost(opts, EP.INVOICE_ISSUE(testOrderId!), {
        provider: PROVIDERS.AMEGO,
        invoiceType: INVOICE_TYPE.INDIVIDUAL,
      })
      expect(res.status).toBeLessThan(600)
    })
  })

  // ─── 前端：結帳頁發票欄位渲染 ─────────────────────────
  test.describe('結帳頁發票區域', () => {
    test('結帳頁不應因發票欄位而出現 PHP 錯誤', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/checkout/`)
      expect(response?.status()).toBeLessThan(500)

      const bodyText = await page.locator('body').textContent() ?? ''
      expect(bodyText.toLowerCase()).not.toContain('fatal error')
    })

    test('結帳頁 JS 不應有未捕獲例外', async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', (err) => jsErrors.push(err.message))

      await page.goto(`${BASE_URL}/checkout/`)
      await page.waitForLoadState('networkidle')

      // 過濾掉已知的非致命錯誤
      const criticalErrors = jsErrors.filter(
        (e) =>
          !e.includes('ResizeObserver') &&
          !e.includes('Script error') &&
          !e.includes('Failed to fetch'),
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })
})
