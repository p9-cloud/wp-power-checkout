<?php

declare ( strict_types = 1 );

namespace J7\PowerCheckout\Domains\Invoice;

use J7\PowerCheckout\Domains\Invoice\Amego\Services\AmegoIntegration;
use J7\PowerCheckout\Domains\Invoice\Shared\Utils\InvoiceUtils;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment;
use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;
use J7\PowerCheckout\Shared\Utils\OrderUtils;

/** Loader 載入電子發票方式 */
final class ServiceRegister {

	// 發票 APP 渲染用的 ID
	private const RENDER_ID = 'power_checkout_invoice_metabox_app';


	/** 註冊 hooks */
	public static function register_hooks(): void {
		// 支援傳統訂單和 HPOS
		// 使用 'add_meta_boxes' hook 可以同時支援兩種儲存方式
		\add_action( 'add_meta_boxes', [ __CLASS__, 'add_invoice_meta_box' ] );
		\add_action( 'admin_enqueue_scripts', [ __CLASS__, 'issue_invoice_script' ], 20 );
		\add_filter( 'power_checkout_register_invoices', [ __CLASS__ , 'register_invoices' ] );

		/** @var array<string, string> $mapper [id, class] */
		$mapper = InvoiceUtils::get_registered_services();

		foreach ( $mapper as $id => $class ) {
			// 如果電子發票啟用，才實例化放入容器
			if (!InvoiceUtils::is_enabled( $id)) {
				continue;
			}
			InvoiceUtils::$container[ $id ] = \call_user_func([ $class, 'instance' ]);
		}
	}

	/** 註冊發票服務 @param array<string, string> $invoice 電子發票 @return array<string, string> */
	public static function register_invoices( array $invoice ): array {
		$invoice[ AmegoIntegration::ID ] = AmegoIntegration::class;
		return $invoice;
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

		if ( !$order ) {
			echo '無法取得訂單資訊';
			return;
		}

		printf( "<div id='%s'></div>", self::RENDER_ID );
	}


	/**
	 * Enqueue 發票 APP Script
	 *
	 * @param string $hook 後台頁面 hook
	 *
	 * @return void
	 */
	public static function issue_invoice_script( $hook ): void {
		if ( !OrderUtils::is_order_detail( $hook ) ) {
			return;
		}
		SettingTabService::enqueue_vue_app();

		$order_id = OrderUtils::get_order_id( $hook );
		$order    = \wc_get_order( $order_id );
		if ( !$order instanceof \WC_Order ) {
			return;
		}

		// 要額外給前端的資料
		$obj_name = self::RENDER_ID . '_data'; // power_checkout_invoice_metabox_app_data
		\wp_localize_script(
			SettingTabService::$handle,
			$obj_name,
			[
				'render_id' => self::RENDER_ID,
				'providers' => InvoiceUtils::get_registered_services(),
				'order'     => [
					'id'                      => (string) $order->get_id(),
					'total'                   => \wc_price( $order->get_total() ),
					'remaining_refund_amount' => \wc_price(
						$order->get_remaining_refund_amount()
					),
				],

			]
		);
	}


	/**
	 * TODO
	 * 設定台灣預設稅率設定
	 *
	 * @return void
	 */
	public static function set_tw_default_setting() {

		$tax_class = \WC_Tax::create_tax_class('零稅率4');

		if ( ! \is_wp_error( $tax_class ) ) {
			// 步驟 2: 為該類別創建實際的稅率
			$tax_rate_id = \WC_Tax::_insert_tax_rate(
				[
					'tax_rate_country' => 'TW',
					'tax_rate'         => '0',
					'tax_rate_name'    => '零稅率4',
					'tax_rate_class'   => $tax_class['slug'], // 使用剛創建的類別 slug
				]
			);
		}

		$order = \wc_get_order( 268 );
		echo '<pre>';
		var_dump(
			[
				'get_items_tax_classes' => $order->get_items_tax_classes(),
			]
		);
		echo '</pre>';
		echo '<br>------------------<br>';
	}
}
