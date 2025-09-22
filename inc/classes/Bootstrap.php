<?php

declare ( strict_types = 1 );

namespace J7\PowerCheckout;

use J7\PowerCheckout\Utils\Base;
use Kucrut\Vite;

if ( class_exists( 'J7\PowerCheckout\Bootstrap' ) ) {
	return;
}

/** Bootstrap */
final class Bootstrap {
	use \J7\WpUtils\Traits\SingletonTrait;

	/** Constructor */
	public function __construct() {

		FrontEnd\Entry::instance();
		Admin\CPT::instance();
		Domains\Payment\Loader::register_hooks();
		Domains\Settings\Services\SettingApiService::register_hooks();
		Domains\Settings\Services\SettingTabService::register_hooks();

		\add_action( 'before_woocommerce_init', [ $this, 'declare_compatibility' ] );
	}


	/**
	 * 宣告區塊結帳相容性
	 *
	 * @return void
	 */
	public function declare_compatibility(): void {
		if ( !class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			return;
		}

		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
			'cart_checkout_blocks',
			'power-checkout\plugin.php'
		);
	}
}
