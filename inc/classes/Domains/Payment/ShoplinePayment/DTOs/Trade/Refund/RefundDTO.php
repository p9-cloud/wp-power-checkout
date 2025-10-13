<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Refund;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\AmountTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\ReferenceOrderIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\RefundMsgTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\RefundOrderIdTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\StatusTrait;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Traits\TradeOrderIdTrait;
use J7\WpUtils\Classes\DTO;

class RefundDTO extends DTO {
	use RefundOrderIdTrait;
	use ReferenceOrderIdTrait;
	use TradeOrderIdTrait;
	use AmountTrait;
	use StatusTrait;
	use RefundMsgTrait;
}
