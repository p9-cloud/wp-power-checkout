<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Utils;

/**
 * 訂單 Utils
 * 因為 HPOS & 傳統訂單儲存，許多地方要判斷 2 次
 * 使用這 Utils 做統一判斷
 */
final class OrderUtils {

	/**  @return bool Is HPOS enabled  */
	public static function is_hpos_enabled(): bool {
		return \class_exists(\Automattic\WooCommerce\Utilities\OrderUtil::class) && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
	}

	/** @return bool Is Order Detail Page */
	public static function is_order_detail( $hook = '' ): bool {
		if (!$hook && isset($_GET['page'])) { // phpcs:ignore
			return 'wc-orders' === $_GET['page'] && isset($_GET['id']); // phpcs:ignore
		}

		if ('woocommerce_page_wc-orders' === $hook) { // HOPS
			return true;
		}

		if ('post.php' === $hook && 'shop_order' === \get_post_type() ) {
			return true;
		}

		return false;
	}

	/** @return int|null 在 Order detail page 取得 order id */
	public static function get_order_id( $hook = '' ): int|null {
		if (!self::is_order_detail($hook)) {
			return null;
		}
		return ( (int) ( @$_GET['post'] ?? @$_GET['id'] ) ) ?: null; // phpcs:ignore
	}
}
