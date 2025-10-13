<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Refund;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\AdditionalDataTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\ReferenceOrderIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\TradeOrderIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\AmountTrait;
use J7\PowerCheckout\Utils\Helper;
use J7\WpUtils\Classes\DTO;

class CreateRefundDTO extends DTO {
	use ReferenceOrderIdTrait;
	use TradeOrderIdTrait;
	use AmountTrait;
	use AdditionalDataTrait;

	/** @var string (256) 退款原因 */
	public string $reason;

	/** @var string (256) Event Webhook callback 的 URL */
	public string $callbackUrl;

	/** @var array<string, string|int> 原始資料 */
	protected array $require_properties = [
		'referenceOrderId',
		'tradeOrderId',
		'amount',
	];


	/**
	 * 自訂驗證邏輯
	 *
	 * @throws \Exception 如果驗證失敗
	 *  */
	protected function validate(): void {
		parent::validate();
		if (isset($this->reason)) {
			( new Helper($this->reason, 'reason', 256 ) )->validate_strlen();
		}
		if (isset($this->callbackUrl)) {
			( new Helper($this->callbackUrl, 'callbackUrl', 256 ) )->validate_strlen();
		}
	}
}
