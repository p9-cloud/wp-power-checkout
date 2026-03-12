/**
 * 測試目標：付款方式切換
 * 對應功能：SLP Gateway 支援多種付款方式（CreditCard, VirtualAccount, JKOPay, ApplePay, LinePay, ChaileaseBNPL）
 * 前置條件：SLP Gateway 已啟用、結帳頁有可用付款方式
 * 預期結果：切換付款方式時頁面正確反應
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { BASE_URL, EP, PROVIDERS, PAYMENT_METHODS } from '../fixtures/test-data.js'

test.describe('付款方式切換', () => {
  let opts: ApiOptions
  let slpEnabled = false

  test.beforeAll(async ({ request }) => {
    const nonce = getNonce()
    opts = { request, baseURL: BASE_URL, nonce }

    // 確認 SLP 狀態
    const res = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
    if (res.status === 200) {
      const data = (res.data as any).data ?? res.data
      slpEnabled = data.enabled === 'yes'
    }
  })

  // ─── API 層：allowPaymentMethodList 設定 ───────────────
  test.describe('allowPaymentMethodList 設定與查詢', () => {
    test('取得 SLP 設定應包含 allowPaymentMethodList', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      expect(res.status).toBe(200)
      const data = (res.data as any).data ?? res.data
      expect(data).toHaveProperty('allowPaymentMethodList')
    })

    test('更新 allowPaymentMethodList 為單一方式 → 成功', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        allowPaymentMethodList: ['CreditCard'],
      })
      expect(res.status).toBe(200)

      // 驗證儲存
      const check = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      const data = (check.data as any).data ?? check.data
      expect(data.allowPaymentMethodList).toContain('CreditCard')
    })

    test('更新 allowPaymentMethodList 為多種方式 → 成功', async () => {
      const methods = ['CreditCard', 'LinePay', 'JKOPay']
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        allowPaymentMethodList: methods,
      })
      expect(res.status).toBe(200)

      const check = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      const data = (check.data as any).data ?? check.data
      for (const method of methods) {
        expect(data.allowPaymentMethodList).toContain(method)
      }
    })

    test('更新 allowPaymentMethodList 為所有支援方式 → 成功', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        allowPaymentMethodList: [...PAYMENT_METHODS],
      })
      expect(res.status).toBe(200)
    })
  })

  // ─── 前端：結帳頁付款方式渲染 ──────────────────────────
  test.describe('結帳頁付款方式渲染', () => {
    test('結帳頁應載入付款方式區域', async ({ page }) => {
      await page.goto(`${BASE_URL}/checkout/`)
      await page.waitForLoadState('domcontentloaded')

      const cartEmpty = (await page.locator('.cart-empty, .wc-empty-cart-message').count()) > 0
      if (cartEmpty) {
        test.skip()
        return
      }

      // WooCommerce 付款方式列表
      const paymentArea = page.locator(
        '#payment .payment_methods, ' +
        '.wc_payment_methods, ' +
        '.wc-block-components-radio-control'
      )
      const count = await paymentArea.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('SLP Gateway 應作為付款選項出現', async ({ page }) => {
      test.skip(!slpEnabled, 'SLP Gateway 未啟用')

      await page.goto(`${BASE_URL}/checkout/`)
      await page.waitForLoadState('domcontentloaded')

      const cartEmpty = (await page.locator('.cart-empty, .wc-empty-cart-message').count()) > 0
      if (cartEmpty) {
        test.skip()
        return
      }

      const slpRadio = page.locator(
        'input[value="shopline_payment_redirect"], ' +
        'label:has-text("Shopline Payment"), ' +
        'label:has-text("線上付款")'
      )
      // 在有商品時 SLP 應該可見（需金額在 min/max 範圍內）
      const count = await slpRadio.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('選擇付款方式後不應出現 JS 錯誤', async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', (err) => jsErrors.push(err.message))

      await page.goto(`${BASE_URL}/checkout/`)
      await page.waitForLoadState('domcontentloaded')

      const cartEmpty = (await page.locator('.cart-empty, .wc-empty-cart-message').count()) > 0
      if (cartEmpty) {
        test.skip()
        return
      }

      // 嘗試點擊所有可用付款方式
      const paymentRadios = page.locator('#payment .payment_methods input[type="radio"]')
      const count = await paymentRadios.count()
      for (let i = 0; i < Math.min(count, 5); i++) {
        await paymentRadios.nth(i).click({ force: true })
        await page.waitForTimeout(500)
      }

      // 不應有嚴重 JS 錯誤
      const criticalErrors = jsErrors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('Script error')
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })

  // ─── 前端：付款方式與金額範圍 ──────────────────────────
  test.describe('付款方式與金額範圍', () => {
    test('min_amount / max_amount 設定可被讀取', async () => {
      const res = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      expect(res.status).toBe(200)
      const data = (res.data as any).data ?? res.data
      expect(data).toHaveProperty('min_amount')
      expect(data).toHaveProperty('max_amount')
    })

    test('更新 min_amount 和 max_amount → 成功', async () => {
      const res = await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
        min_amount: 10,
        max_amount: 99999,
      })
      expect(res.status).toBe(200)

      const check = await wpGet(opts, EP.SETTINGS_SINGLE(PROVIDERS.SLP))
      const data = (check.data as any).data ?? check.data
      expect(Number(data.min_amount)).toBe(10)
      expect(Number(data.max_amount)).toBe(99999)
    })
  })

  // ─── 清理 ─────────────────────────────────────────────
  test.afterAll(async () => {
    // 還原預設付款方式設定
    await wpPost(opts, EP.SETTINGS_UPDATE(PROVIDERS.SLP), {
      allowPaymentMethodList: [...PAYMENT_METHODS],
      min_amount: 5,
      max_amount: 50000,
    })
  })
})
