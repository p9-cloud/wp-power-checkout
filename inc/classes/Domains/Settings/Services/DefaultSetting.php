<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Settings\Services;

class DefaultSetting {

	/** Register hooks */
	public static function register_hooks(): void {
		\add_filter( 'woocommerce_product_get_tax_status', [ __CLASS__, 'modify_tax_status' ], 10, 2 );
	}

	public function modify_tax_status( $status, $product ) {
		if ( $status === 'custom' ) {
			// 在這裡寫你的稅務邏輯，例如依商品類別或使用者角色判斷
			return 'taxable'; // 或其他你需要的值
		}
		return $status;
	}
}
