/**
 * LINE Pay 成功付款錄影腳本
 *
 * 錄製流程：
 * 1. 登入管理後台
 * 2. 建立測試商品 & 訂單（pending 狀態）
 * 3. 前往後台訂單頁面，展示訂單狀態為「等待付款」
 * 4. 模擬 LINE Pay 成功付款 webhook
 * 5. 重新整理頁面，展示訂單狀態變為「處理中」
 * 6. 清理測試資料
 */
import { chromium } from '@playwright/test'
import * as path from 'path'
import { getNonce } from './helpers/admin-setup.js'
import { BASE_URL, EP } from './fixtures/test-data.js'

const WEBHOOK_BASE_URL = 'http://turbo.local'
const VIDEO_DIR = path.resolve(import.meta.dirname, '../../') // 專案根目錄

async function main() {
  console.log('🎬 開始錄影：LINE Pay 成功付款流程')
  console.log(`📁 影片輸出目錄：${VIDEO_DIR}`)

  const nonce = getNonce()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: path.resolve(import.meta.dirname, '.auth/admin.json'),
    ignoreHTTPSErrors: true,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
  })

  const page = await context.newPage()

  try {
    // ── Step 1: 建立測試商品 ───────────────────────────
    console.log('📦 建立測試商品...')
    const productRes = await context.request.post(
      `${BASE_URL}/wp-json/wc/v3/products`,
      {
        headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' },
        data: {
          name: '[錄影] LINE Pay 測試商品',
          type: 'simple',
          regular_price: '1000',
          status: 'publish',
        },
      },
    )
    const product = await productRes.json()
    const productId = product.id
    console.log(`  ✅ 商品已建立: #${productId}`)

    // ── Step 2: 建立測試訂單（pending 狀態）────────────
    console.log('📋 建立測試訂單（pending 狀態）...')
    const tradeOrderId = `record_linepay_${Date.now()}`
    const orderRes = await context.request.post(
      `${BASE_URL}/wp-json/wc/v3/orders`,
      {
        headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' },
        data: {
          status: 'pending',
          payment_method: 'shopline_payment_redirect',
          payment_method_title: 'Shopline Payment 線上付款',
          billing: {
            first_name: '王',
            last_name: '小明',
            email: 'linepay-demo@example.com',
            phone: '0912345678',
            address_1: '台北市信義區信義路五段7號',
            city: '台北市',
            state: '',
            postcode: '110',
            country: 'TW',
          },
          line_items: [{ product_id: productId, quantity: 1 }],
          meta_data: [
            { key: '_pc_payment_identity', value: tradeOrderId },
          ],
        },
      },
    )
    const order = await orderRes.json()
    const orderId = order.id
    console.log(`  ✅ 訂單已建立: #${orderId}（tradeOrderId: ${tradeOrderId}）`)

    // ── Step 3: 前往後台訂單頁面，展示 pending 狀態 ─────
    console.log('🔍 前往後台查看訂單（狀態：等待付款）...')
    await page.goto(`${BASE_URL}/wp-admin/admin.php?page=wc-orders&action=edit&id=${orderId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForTimeout(2000) // 等頁面完整載入

    // 高亮訂單狀態
    await page.evaluate(() => {
      const statusEl = document.querySelector('#order_status, .wc-order-status')
      if (statusEl) {
        (statusEl as HTMLElement).style.border = '3px solid red'
        ;(statusEl as HTMLElement).style.borderRadius = '4px'
      }
    })
    await page.waitForTimeout(2000)

    // ── Step 4: 模擬 LINE Pay 成功付款 webhook ──────────
    console.log('🔔 發送 LINE Pay 成功付款 Webhook...')
    const webhookPayload = {
      id: `EVT_RECORD_LINEPAY_${Date.now()}`,
      type: 'trade.succeeded',
      created: Date.now(),
      data: {
        referenceOrderId: `RL_RECORD_${tradeOrderId}`,
        tradeOrderId,
        status: 'SUCCEEDED',
        actionType: 'SDK',
        order: {
          merchantId: '3252264968486264832',
          referenceOrderId: `RL_RECORD_${tradeOrderId}`,
          createTime: Math.floor(Date.now() / 1000),
          amount: { currency: 'TWD', value: 100000 },
          customer: {
            referenceCustomerId: 'RECORD_CUSTOMER',
            customerId: 'SLP_RECORD',
          },
        },
        payment: {
          paymentMethod: 'LinePay',
          paymentBehavior: 'Regular',
          paidAmount: { currency: 'TWD', value: 100000 },
          paymentInstrument: { savePaymentInstrument: false },
          paymentSuccessTime: String(Date.now()),
        },
        paymentMsg: { code: '', msg: '' },
      },
    }

    const webhookRes = await fetch(`${WEBHOOK_BASE_URL}/wp-json/${EP.WEBHOOK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'timestamp': String(Date.now()),
        'sign': 'record_test_sign',
        'apiVersion': 'V1',
      },
      body: JSON.stringify(webhookPayload),
    })
    console.log(`  ✅ Webhook 回應: ${webhookRes.status}`)

    // ── Step 5: 重新整理頁面，展示 processing 狀態 ──────
    console.log('🔄 重新整理頁面，查看訂單狀態變更...')
    await page.waitForTimeout(1000)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // 高亮訂單狀態
    await page.evaluate(() => {
      const statusEl = document.querySelector('#order_status, .wc-order-status')
      if (statusEl) {
        (statusEl as HTMLElement).style.border = '3px solid green'
        ;(statusEl as HTMLElement).style.borderRadius = '4px'
      }
    })
    await page.waitForTimeout(3000) // 讓錄影多停留一會

    // 驗證狀態
    const orderAfter = await context.request.get(
      `${BASE_URL}/wp-json/wc/v3/orders/${orderId}`,
      { headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' } },
    )
    const orderData = await orderAfter.json()
    console.log(`  ✅ 訂單狀態: ${orderData.status}`)

    // ── Step 6: 清理 ────────────────────────────────────
    console.log('🧹 清理測試資料...')
    await context.request.delete(
      `${BASE_URL}/wp-json/wc/v3/orders/${orderId}?force=true`,
      { headers: { 'X-WP-Nonce': nonce } },
    ).catch(() => {})
    await context.request.delete(
      `${BASE_URL}/wp-json/wc/v3/products/${productId}?force=true`,
      { headers: { 'X-WP-Nonce': nonce } },
    ).catch(() => {})
    console.log('  ✅ 清理完成')

  } catch (err) {
    console.error('❌ 錄影過程出錯:', (err as Error).message)
  }

  // 關閉頁面取得影片路徑
  const videoPath = await page.video()?.path()
  await page.close()
  await context.close()
  await browser.close()

  if (videoPath) {
    console.log(`\n🎬 影片已儲存: ${videoPath}`)
  } else {
    console.log('\n⚠️ 未取得影片路徑')
  }

  console.log('✅ 錄影完成！')
}

main().catch(console.error)
