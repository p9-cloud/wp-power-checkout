<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Session;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits\AmountTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits\ReferenceIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits\SessionIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits\SessionUrlTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits\StatusTrait;
use J7\WpUtils\Classes\DTO;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Components;

/**
 * Shopline Payment 跳轉式支付 SessionDTO
 *
 * @see https://docs.shoplinepayments.com/api/trade/session/
 */
final class SessionDTO extends DTO {
	use ReferenceIdTrait;
	use SessionIdTrait;
	use StatusTrait;
	use AmountTrait;
	use SessionUrlTrait;

	/** @var int *訂單建立時間 timestamp 13位毫秒 */
	public int $createTime;

	/** @var Components\PaymentDetail[]|null 付款方式詳細資訊 */
	public array|null $paymentDetails;

	/** @var array<string> 必填屬性 */
	protected array $require_properties = [
		'sessionId',
		'referenceId',
		'status',
		'sessionUrl',
		'createTime',
		'amount',
	];

	/**
	 * 創建實例
	 *
	 * @param array $args 參數
	 * @return self 實例
	 */
	public static function create( array $args ): self {
		$args['amount'] = Components\Amount::parse( $args['amount'] );
		if ( isset( $args['paymentDetails'] ) ) {
			$args['paymentDetails'] = array_map( fn( $payment_detail ) => Components\PaymentDetail::parse( $payment_detail ), $args['paymentDetails'] );
		}

		return new self($args);
	}

	/**
	 * 自訂驗證邏輯
	 *
	 * @throws \Exception 如果驗證失敗
	 *  */
	protected function validate(): void {
		parent::validate();
		if (isset( $this->status)) {
			Enums\ResponseStatus::from( $this->status );
		}
	}
}
