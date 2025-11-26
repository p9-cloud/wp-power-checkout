<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Utils;

use J7\PowerCheckout\Shared\DTOs\CheckoutFieldDTO;

/**
 * 輔助新增 Checkout Fields
 * 同時兼容傳統結帳 & 區塊結帳
 */
final class CheckoutFields {

	// 透過此 hook 可以新增 Checkout Fields
	private const HOOK_NAME = 'power-checkout/checkout_fields';

	/** @var array<CheckoutFieldDTO> $fields  */
	private static array $fields = [];

	/** 註冊 hooks */
	public static function register_hooks(): void {
		\add_filter( 'woocommerce_checkout_fields', [ __CLASS__, 'render_invoice_field' ]);
		\add_action( 'woocommerce_init', [ __CLASS__, 'render_invoice_field_block' ]);
		\add_action( 'woocommerce_checkout_update_order_meta', [ __CLASS__, 'save_checkout_field_to_order' ] );
	}

	/** 註冊欄位 */
	public static function register_field( CheckoutFieldDTO $field ): void {
		\add_filter(
			self::HOOK_NAME,
			static function ( $fields ) use ( $field ) {
				$fields[] = $field;
				return $fields;
			}
			);
	}

	/** @return array<CheckoutFieldDTO> 取得所有註冊的欄位 */
	private static function get_fields(): array {
		return \apply_filters( self::HOOK_NAME, self::$fields  );
	}

	/**
	 * @param array $fields 欄位
	 *
	 * @return array
	 */
	public static function render_invoice_field( array $fields ): array {
		foreach (self::get_fields() as $field) {
			$fields[ $field->field_type ][ $field->id ] = $field->to_traditional_checkout_args();
		}
		return $fields;
	}

	/** 區塊結帳新增欄位 @see https://developer.woocommerce.com/docs/block-development/tutorials/how-to-additional-checkout-fields-guide/ */
	public static function render_invoice_field_block(): void {
		if ( ! \function_exists( 'woocommerce_register_additional_checkout_field' ) ) {
			return;
		}

		foreach (self::get_fields() as $field) {
			\woocommerce_register_additional_checkout_field($field->to_block_checkout_args());
		}
	}

	public function save_checkout_field_to_order( int $order_id ): void {
		$order = \wc_get_order( $order_id );
		if ( ! $order instanceof \WC_Order ) {
			return;
		}

		foreach (self::get_fields() as $field) {

			if ( isset( $_POST['billing_birthday'] ) ) {
				// 透過 set_meta 方法，WooCommerce 會自動處理儲存到傳統 post meta 或 HPOS custom table。
				$order->set_meta_data( '_billing_birthday', sanitize_text_field( wp_unslash( $_POST['billing_birthday'] ) ) );
			}
			$order->update_meta_data( $field->id, sanitize_text_field( wp_unslash( $_POST[ $field->id ] ) ) );
		}

		$order->save();
	}
}
