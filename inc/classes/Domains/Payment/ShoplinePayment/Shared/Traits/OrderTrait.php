<?php

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Components\Webhook\Order;

trait OrderTrait {
	/** @var Order *訂單資訊 */
	public Order $order;
}
