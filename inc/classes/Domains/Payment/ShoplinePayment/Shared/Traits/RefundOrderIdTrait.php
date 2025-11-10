<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits;

trait RefundOrderIdTrait {
	/** @var string *SLP 退款訂單號 (32)*/
	public string $refundOrderId;
}
