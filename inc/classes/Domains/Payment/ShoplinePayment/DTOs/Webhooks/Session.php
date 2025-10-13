<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\AmountTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\ReferenceIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\SessionIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\SessionUrlTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\StatusTrait;
use J7\WpUtils\Classes\DTO;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Components;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\ResponseStatus;

/**
 * 結帳交易
 *
 * @see https://docs.shoplinepayments.com/api/event/model/session/
 */
final class Session extends DTO {
    use ReferenceIdTrait;
    use SessionIdTrait;
	use StatusTrait;
    use AmountTrait;
    use SessionUrlTrait;
    
	/** @var int *訂單建立時間 */
	public int $createTime;

	/** @var Components\PaymentDetail[] 付款方式詳細資訊 */
	public array|null $paymentDetails = null;

	/** @var array 必填屬性 */
	protected array $require_properties = [
		'sessionId',
		'referenceId',
		'status',
		'sessionUrl',
		'createTime',
		'amount',
	];

	/**
	 * 組成變數的主要邏輯可以寫在裡面
	 *
	 * @param array{
	 *    sessionId: string,
	 *    referenceId: string,
	 *    status: ResponseStatus::value,
	 *    sessionUrl: string,
	 *    createTime: int,
	 *    amount: array{
	 *      currency: string,
	 *      value: int,
	 *    },
	 *    paymentDetails: array<array<string, mixed>>,
	 * } $args
	 */
	public static function create( array $args ): self {
		if ( isset( $args['paymentDetails'] ) ) {
			$args['paymentDetails'] = array_map( fn( $payment_detail ) => Components\PaymentDetail::parse( $payment_detail ), $args['paymentDetails'] );
		}
		$args['amount'] = Components\Amount::parse( $args['amount'] );
		return new self( $args );
	}

	/** 自訂驗證邏輯 */
    protected function validate(): void {
		parent::validate();
		if (isset( $this->status)) {
			ResponseStatus::from( $this->status );
		}
	}
}
