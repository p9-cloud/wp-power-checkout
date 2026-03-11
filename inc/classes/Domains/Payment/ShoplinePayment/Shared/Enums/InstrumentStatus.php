<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums;

/**
 * InstrumentStatus 付款工具狀態
 */
enum InstrumentStatus: string {
	/** 建立 */
	case CREATED = 'CREATED';
	/** 綁定成功 */
	case SUCCEEDED = 'SUCCEEDED';
	/** 解綁 */
	case DISABLED = 'DISABLED';
	/** 綁定失敗 */
	case FAILED = 'FAILED';

	/** @return string 取得標籤 */
	public function label(): string {
		return match ( $this ) {
			self::CREATED => '建立',
			self::SUCCEEDED => '綁定成功',
			self::DISABLED => '解綁',
			self::FAILED => '綁定失敗',
		};
	}
}
