<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\Shared;

/**
 * 請求、回應參數
 * 每次付款請求，不論是哪種付款方式，都將請求參數、回應參數 raw data 儲存在 order meta 中
 */
class Params {

	/** @var string 專門儲存第三方金流那邊的識別碼，可以對應訂單 例如：SLP 的 sessionId  */
	private const IDENTITY_KEY = 'pc_identity';

	/** @var string 專門儲存第三方金流那邊的識別碼，可以對應付款(因為一筆訂單可以有多次付款) 例如：SLP 的 tradeOrderId  */
	private const IDENTITY_PAYMENT_KEY = 'pc_payment_identity';

	/** @var string 紀錄付款詳情 */
	private const PAYMENT_DETAIL_KEY = 'pc_payment_detail';

	/** Construct */
	public function __construct(
		private readonly \WC_Order $_order,
	) {}

	/**
	 * 取得訂單識別碼
	 *
	 * @return string
	 */
	public function get_identity(): string {
		$payment_detail_array = $this->_order->get_meta( self::IDENTITY_KEY ) ?: '';
		return (string) $payment_detail_array;
	}

	/**
	 * 儲存訂單識別碼
	 *
	 * @param string $value 訂單識別碼
	 * @return void
	 */
	public function update_identity( string $value ): void {
		$this->_order->update_meta_data( self::IDENTITY_KEY, $value );
		$this->_order->save_meta_data();
	}


	/**
	 * 取得付款識別碼
	 *
	 * @return string
	 */
	public function get_payment_identity(): string {
		$payment_detail_array = $this->_order->get_meta( self::IDENTITY_PAYMENT_KEY ) ?: '';
		return (string) $payment_detail_array;
	}

	/**
	 * 儲存付款識別碼
	 *
	 * @param string $value 付款識別碼
	 * @return void
	 */
	public function update_payment_identity( string $value ): void {
		$this->_order->update_meta_data( self::IDENTITY_PAYMENT_KEY, $value );
		$this->_order->save_meta_data();
	}


	/**
	 * 取得付款詳情 array
	 *
	 * @return array<string, mixed>
	 */
	public function get_payment_detail(): array {
		$payment_detail_array = $this->_order->get_meta( self::PAYMENT_DETAIL_KEY ) ?: [];
		return is_array($payment_detail_array) ? $payment_detail_array : [];
	}

	/**
	 * 儲存付款詳情 array
	 *
	 * @param array<string, mixed> $value 付款詳情 array
	 * @return void
	 */
	public function update_payment_detail( array $value ): void {
		$this->_order->update_meta_data( self::PAYMENT_DETAIL_KEY, $value );
		$this->_order->save_meta_data();
	}
}
