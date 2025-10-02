<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Abstracts;

use J7\PowerCheckout\Domains\Payment\Shared\Abstracts\AbstractPaymentGateway;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Services\RegisterIntegration;

/** Shopline 跳轉支付付款閘道抽象類別 */
abstract class PaymentGateway extends AbstractPaymentGateway {

	/**
	 * Return the gateway's icon.
	 *
	 * @return string
	 */
	public function get_icon() {
		return \sprintf(
			'<img src="%1$s" alt="%2$s">',
						RegisterIntegration::$icon_url,
						RegisterIntegration::$name
		);
	}
}
