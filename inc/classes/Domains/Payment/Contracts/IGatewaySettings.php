<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\Contracts;

interface IGatewaySettings {

	/** @return class-string<IGateway>  取得此付款方式的 ID */
	public static function get_gateway_id(): string;
}
