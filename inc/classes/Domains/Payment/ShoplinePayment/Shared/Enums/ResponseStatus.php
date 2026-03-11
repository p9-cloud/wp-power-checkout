<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums;

/**
 * Shopline Payment 跳轉式支付 Response Status
 */
enum ResponseStatus: string {
	/** 建立 */
	case CREATED = 'CREATED';
	/** 顧客處理中 */
	case CUSTOMER_ACTION = 'CUSTOMER_ACTION';
	/** 內部處理中 */
	case PROCESSING = 'PROCESSING';
	/** 處理中 */
	case PENDING = 'PENDING';
	/** 成功 */
	case SUCCEEDED = 'SUCCEEDED';
	/** 已逾期 */
	case EXPIRED = 'EXPIRED';
	/** 失敗 */
	case FAILED = 'FAILED';
	/** 已取消 */
	case CANCELLED = 'CANCELLED';

	/** @return string 取得狀態的標籤 */
	public function label(): string {
		return match ( $this ) {
			self::CREATED => '任務已創建，處理中...',
			self::CUSTOMER_ACTION => '顧客處理中',
			self::PROCESSING => '內部處理中',
			self::PENDING => '處理中',
			self::SUCCEEDED => '成功',
			self::FAILED => '失敗',
			self::CANCELLED => '已取消',
			self::EXPIRED => '已過期',
		};
	}


	/** @return string 取得狀態的 Emoji */
	public function emoji(): string {
		return match ( $this ) {
			self::CREATED => '🆕',
			self::CUSTOMER_ACTION => '🧑‍💻',
			self::PROCESSING => '🚧',
			self::PENDING => '🟧',
			self::SUCCEEDED => '✅',
			self::FAILED => '❌',
			self::CANCELLED => '🚫',
			self::EXPIRED => '⌛',
		};
	}
}
