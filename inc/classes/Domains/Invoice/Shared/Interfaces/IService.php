<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Invoice\Shared\Interfaces;

interface IService {

	/**
	 * 開立發票
	 *
	 * @param \WC_Order $order 訂單
	 *
	 * @return array{code:int, message:string, data:array} API 資料
	 */
	public function issue( \WC_Order $order ): array;

	/**
	 * 做廢發票
	 *
	 * @param \WC_Order $order 訂單
	 *
	 * @return array{code:int, message:string, data:array} API 資料
	 */
	public function cancel( \WC_Order $order ): array;
}
