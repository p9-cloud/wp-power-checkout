<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Refund\RefundDTO;

/**
 * 退款交易
 *
 * @see https://docs.shoplinepayments.com/api/event/model/refund/
 */
final class Refund extends RefundDTO {
	/** @var string|null 第三方平台流水號，街口支付和 LINE Pay 特店對帳使用 選填 */
	public string|null $channelDealId = null;
}
