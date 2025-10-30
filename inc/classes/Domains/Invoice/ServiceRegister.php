<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Invoice;

use J7\PowerCheckout\Domains\Invoice\Amego\Services\AmegoService;
use J7\PowerCheckout\Domains\Invoice\Shared\Interfaces\IService;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment;
use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;
use J7\PowerCheckout\Shared\Utils\OrderUtils;

/** Loader 載入電子發票方式 */
final class ServiceRegister {

	// 發票 APP 渲染用的 ID
	private const RENDER_ID = 'power_checkout_invoice_metabox_app';

	// 註冊 invoice provider 使用的 hook name
	private const REGISTER_INVOICE_PROVIDER_HOOK_NAME = 'power_checkout_invoice_providers';

	/** 註冊 hooks */
	public static function register_hooks(): void {
		// 支援傳統訂單和 HPOS
		// 使用 'add_meta_boxes' hook 可以同時支援兩種儲存方式
		\add_action( 'add_meta_boxes', [ __CLASS__, 'add_invoice_meta_box' ] );
		\add_action( 'admin_enqueue_scripts', [ __CLASS__, 'issue_invoice_script' ], 20 );
		\add_filter(self::REGISTER_INVOICE_PROVIDER_HOOK_NAME, [ __CLASS__, 'register_invoice_providers' ]);
	}

	/**
	 * 註冊服務提供商
	 *
	 * @param array $providers 服務提供商
	 *
	 * @return array<string, IService> 服務提供商 service_id, service
	 */
	public static function register_invoice_providers( array $providers ): array {
		$providers[ AmegoService::ID ] = new AmegoService();
		return $providers;
	}

	/**
	 * 新增發票 MetaBox
	 *
	 * @param string $post_type 文章類型
	 */
	public static function add_invoice_meta_box( string $post_type ): void { // phpcs:ignore
		// 支援 HPOS 和傳統訂單
		// HPOS: screen_id 為 'woocommerce_page_wc-orders'
		// 傳統: post_type 為 'shop_order'
		$order_screen_ids = [ 'shop_order' ];

		// 檢查是否啟用 HPOS
		if ( \class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) ) {
			if ( \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() ) {
				$order_screen_ids[] = \wc_get_page_screen_id( 'shop-order' );
			}
		}

		\add_meta_box(
			'power_checkout_invoice_meta_box',
			__( '電子發票資訊', 'power-checkout' ),
			[ __CLASS__, 'render_invoice_meta_box' ],
			$order_screen_ids,
			'side',
			'high'
		);
	}

	/**
	 * 渲染發票 MetaBox 內容
	 *
	 * @param \WP_Post|\WC_Order $post_or_order 訂單物件 (HPOS) 或文章物件 (傳統)
	 */
	public static function render_invoice_meta_box( \WP_Post|\WC_Order $post_or_order ): void {
		// 取得訂單物件
		$order = $post_or_order instanceof \WC_Order ? $post_or_order : \wc_get_order( $post_or_order->ID );

		if ( ! $order ) {
			echo '無法取得訂單資訊';
			return;
		}

		printf("<div id='%s'></div>", self::RENDER_ID);
	}



	/**
	 * Enqueue 發票 APP Script
	 *
	 * @param string $hook 後台頁面 hook
	 *
	 * @return void
	 */
	public static function issue_invoice_script( $hook ): void {
		if (!OrderUtils::is_order_detail($hook)) {
			return;
		}
		SettingTabService::enqueue_vue_app();

		$order_id = OrderUtils::get_order_id($hook);
		$order    = \wc_get_order($order_id);
		if (!$order instanceof \WC_Order) {
			return;
		}

		// 要額外給前端的資料
		$obj_name = self::RENDER_ID . '_data'; // power_checkout_invoice_metabox_app_data
		\wp_localize_script(
			SettingTabService::$handle,
			$obj_name,
			[
				'render_id' => self::RENDER_ID,
				'providers' => self::get_services(),
				'order'     => [
					'id'                      => (string) $order->get_id(),
					'total'                   => \wc_price($order->get_total()),
					'remaining_refund_amount' => \wc_price($order->get_remaining_refund_amount()),
				],

			]
		);
	}

	/** @return array<IService> 取得所有的服務提供商*/
	public static function get_services(): array {
		return \apply_filters( self::REGISTER_INVOICE_PROVIDER_HOOK_NAME, []);
	}

	/**
	 * 註冊服務提供商
	 *
	 * @param string $service_id 發票服務 id
	 *
	 * @return IService|null
	 */
	public static function get_service( string $service_id ): IService|null {
		return self::get_services()[ $service_id ] ?? null;
	}
}
