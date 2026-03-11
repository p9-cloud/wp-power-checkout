<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\Shared\Enums;

/**
 * 訂單狀態
 * 先列出 WC 基本狀態
 *
 * 付款失敗  => 等待付款中
 * 逾時未付  => 取消
 *  */
enum OrderStatus: string {

	/** 等待付款中 */
	case PENDING = 'pending';

	/** 處理中(已付款) */
	case PROCESSING = 'processing';

	/** 保留 (爭議款，系統轉換中) */
	case ON_HOLD = 'on-hold';

	/** 已完成(已付款+已出貨) */
	case COMPLETED = 'completed';

	/** 已取消 */
	case CANCELLED = 'cancelled';

	/** 已退款 */
	case REFUNDED = 'refunded';

	/** 失敗 */
	case FAILED = 'failed';

	/** 草稿 */
	case CHECKOUT_DRAFT = 'checkout-draft';

	/**
	 * 取得訂單狀態的標籤
	 *
	 * @return string 訂單狀態的標籤
	 */
	public function label(): string {
		return \wc_get_order_status_name($this->value);
	}
}
