<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Payment\PaymentDTO;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\ResponseStatus;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\ResponseSubStatus;

/**
 * 付款交易
 *
 * @see https://docs.shoplinepayments.com/api/event/model/payment/
 */
final class Payment extends PaymentDTO {

	/** 自訂驗證邏輯 */
	protected function validate(): void {
		parent::validate();
		if (isset($this->status)) {
			ResponseStatus::from($this->status);
		}

		if ( isset($this->subStatus) ) {
			ResponseSubStatus::from($this->subStatus);
		}
	}
}
