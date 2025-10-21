<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Payment\Shared\Services;

use J7\PowerCheckout\Domains\Payment\Shared\Abstracts\AbstractPaymentGateway;
use J7\PowerCheckout\Domains\Payment\Shared\Enums\OrderStatus;
use J7\WpUtils\Classes\ApiBase;
use J7\WpUtils\Traits\SingletonTrait;

class PaymentApiService extends ApiBase {
	use SingletonTrait;

	/** @var string REST API namespace */
	protected $namespace = 'power-checkout/v1';

	/** @var array 已註冊的 API 列表 */
	protected $apis = [
		[
			'endpoint' => 'refund',
			'method'   => 'post',
		],
		[
			'endpoint' => 'refund/manual',
			'method'   => 'post',
		],
	];

	/** Register hooks @return void */
	public static function register_hooks(): void {
		self::instance();
	}

	/**
	 * 使用 Gateway 退款
	 *
	 * @param \WP_REST_Request $request Request.
	 *
	 * @return \WP_REST_Response
	 */
	public function post_refund_callback( \WP_REST_Request $request ): \WP_REST_Response {

		$order_id = $request->get_param('order_id');
		if (!\is_numeric( $order_id)) {
			throw new \Exception('訂單編號必須是數字');
		}
		$order = \wc_get_order($order_id);
		if (!$order instanceof \WC_Order) {
			throw new \Exception("找不到訂單 #{$order_id}");
		}
		$remaining_refund_amount = $order->get_remaining_refund_amount();

		if (!$remaining_refund_amount) {
			throw new \Exception("訂單 #{$order_id} 已經沒有餘額可退");
		}

		/** @var AbstractPaymentGateway $gateway */
		$gateway = \wc_get_payment_gateway_by_order( $order );
		if (!( $gateway instanceof AbstractPaymentGateway )) {
			throw new \Exception("{$gateway->id} 不是 AbstractPaymentGateway 的實例");
		}

		if (\method_exists( $gateway, 'handle_payment_gateway_refund')) {
			$refund = \wc_create_refund(
				[
					'amount'   => (float) $remaining_refund_amount,
					'reason'   => '',
					'order_id' => $order_id,
				]
				);
			$gateway->handle_payment_gateway_refund( (int) $order_id, $refund->get_id() );
		} else {
			$gateway->process_refund( $order_id, (float) $remaining_refund_amount );
		}

		$result = $gateway->process_refund( $order_id, (float) $remaining_refund_amount );
		if (\is_wp_error($result)) {
			throw new \Exception($result->get_error_message());
		}

		return new \WP_REST_Response(
			[
				'code'    => 'success',
				'message' => "訂單 #{$order_id} 透過 {$gateway->method_title} 退款成功",
				'data'    => null,
			],
			200
		);
	}

	/**
	 * 手動退款
	 *
	 * @param \WP_REST_Request $request Request.
	 *
	 * @return \WP_REST_Response
	 */
	public function post_refund_manual_callback( \WP_REST_Request $request ): \WP_REST_Response {
		$order_id = $request->get_param('order_id');
		if (!\is_numeric( $order_id)) {
			throw new \Exception('order_id must be numeric');
		}
		$order = \wc_get_order($order_id);
		if (!$order instanceof \WC_Order) {
			throw new \Exception("#{$order_id} order not found");
		}

		$order->update_status( OrderStatus::REFUNDED->value);
		return new \WP_REST_Response(
			[
				'code'    => 'success',
				'message' => "訂單 #{$order_id} 手動退款成功",
				'data'    => null,
			],
			200
		);
	}
}
