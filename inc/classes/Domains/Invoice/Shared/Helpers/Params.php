<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Invoice\Shared;

/** 每次發票請求，不論是哪種發票，都將資料儲存在 order meta 中 */
class Params {

	/** @var string 專門儲存第三方金流那邊的識別碼，可以對應訂單  */
	private const IDENTITY_KEY = 'pc_invoice_identity';

	/** @var string 紀錄開立發票資料  */
	private const ISSUE_INVOICE_KEY = 'pc_issue_invoice';

	/** @var string 紀錄取消發票詳情 */
	private const CANCEL_INVOICE_KEY = 'pc_cancel_invoice';

	/** Construct */
	public function __construct(
		private readonly \WC_Order $_order,
	) {}

	/** @return string 取得訂單識別碼 */
	public function get_identity(): string {
		$identity = $this->_order->get_meta( self::IDENTITY_KEY ) ?: '';
		return (string) $identity;
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
	 * @param string $key KEY
	 * @param mixed  $default 預設值
	 * @return string 取得開立發票的資料
	 */
	public function get_issue_data( string $key = '', mixed $default = null ): mixed {
		$issue_data_array = (array) ( $this->_order->get_meta( self::ISSUE_INVOICE_KEY ) ?: [] );
		if (!$key) {
			return $issue_data_array;
		}
		return $issue_data_array[ $key ] ?? $default;
	}

	/**
	 * 儲存開立發票的資料
	 *
	 * @param array $value 開立發票的資料
	 * @return void
	 */
	public function update_issue_data( array $value ): void {
		$this->_order->update_meta_data( self::ISSUE_INVOICE_KEY, $value );
		$this->_order->save_meta_data();
	}


	/**
	 * 用 IDENTITY_KEY 取得 Order
	 *
	 * @param string $identity_key identity_key 的值
	 *
	 * @return \WC_Order|null
	 */
	public static function get_order_by_identity_payment_key( string $identity_key ): \WC_Order|null {
		$args = [
			'limit'      => 1,
            'meta_key'   => self::ISSUE_INVOICE_KEY, // phpcs:ignore
            'meta_value' => $identity_key,// phpcs:ignore
		];

		$orders = \wc_get_orders($args);
		$order  = \reset($orders);
		return ( $order instanceof \WC_Order ) ? $order : null;
	}


	/**
	 * 取得取消發票資料 array
	 *
	 * @return array<string, mixed>
	 */
	public function get_cancel_data(): array {
		$cancel_data_array = $this->_order->get_meta( self::CANCEL_INVOICE_KEY ) ?: [];
		return \is_array($cancel_data_array) ? $cancel_data_array : [];
	}

	/**
	 * 儲存取消發票資料 array
	 *
	 * @param array<string, mixed> $value 取消發票資料 array
	 * @return void
	 */
	public function update_cancel_data( array $value ): void {
		$this->_order->update_meta_data( self::CANCEL_INVOICE_KEY, $value );
		$this->_order->save_meta_data();
	}
}
