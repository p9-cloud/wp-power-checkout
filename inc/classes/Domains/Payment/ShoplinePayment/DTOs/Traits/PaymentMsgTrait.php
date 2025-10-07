<?php

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Components\PaymentError;

trait PaymentMsgTrait {
	/** @var PaymentError|null 支付錯誤訊息 (PaymentError) 選填 */
	public PaymentError|null $paymentMsg;
}
