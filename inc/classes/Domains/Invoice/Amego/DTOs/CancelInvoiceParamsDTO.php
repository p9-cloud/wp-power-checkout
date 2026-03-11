<?php

declare( strict_types = 1 );

namespace J7\PowerCheckout\Domains\Invoice\Amego\DTOs;

use J7\PowerCheckout\Domains\Invoice\Shared\Helpers\MetaKeys;
use J7\WpUtils\Classes\DTO;


/** 作廢發票請求參數 DTO */
final class CancelInvoiceParamsDTO extends DTO {

	/** @var array<int,\WC_Order> $orders 訂單 array  */
	protected array $orders = [];

	/**
	 * 取得公開的屬性 array
	 *
	 * @return array<string,mixed>
	 */
	public function to_array(): array {
		/** @var array<string, mixed> $invoice_number_array */
		$invoice_number_array = [];
		foreach ($this->orders as $order) {
			$params         = new MetaKeys( $order );
			$invoice_number = $params->get_issued_data('invoice_number');
			if (!$invoice_number) {
				continue;
			}
			$invoice_number_array[] = [
				'CancelInvoiceNumber' => $invoice_number,
			];
		}
		if (!$invoice_number_array) {
			$order_ids = \implode(',', \array_map(fn( $order ) => "#{$order->get_id()} ", $this->orders));
			throw new \Exception( "{$order_ids} 找不到發票號碼" );
		}

		/** @var array<string, mixed> $result */
		$result = $invoice_number_array;
		return $result;
	}
}
