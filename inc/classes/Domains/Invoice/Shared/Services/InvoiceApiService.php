<?php
/**
 * 發票 Api Service
 * 1. 開立發票
 * 2. 做廢發票
 */

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Invoice\Shared\Services;

use J7\PowerCheckout\Domains\Invoice\Shared\Interfaces\IService;
use J7\WpUtils\Classes\ApiBase;
use J7\WpUtils\Classes\WP;

/** Invoice Api Service */
final class InvoiceApiService extends ApiBase {

	/** @var string $namespace */
	protected $namespace = 'power-checkout/invoice';

	/**
	 * @var array<array{
	 * endpoint:string,
	 * method:string,
	 * permission_callback?: callable|null,
	 * callback?: callable|null,
	 * schema?: array<string, mixed>|null
	 * }> $apis APIs
	 *
	 * @phpstan-ignore-next-line
	 * */
	protected $apis = [
		[
			'endpoint' => 'issue',
			'method'   => 'post',
		],
		[
			'endpoint' => 'cancel',
			'method'   => 'post',
		],
	];

	/**
	 * 開立發票
	 *
	 * @param \WP_REST_Request $request 請求
	 *
	 * @return \WP_REST_Response 回應
	 */
	public function post_issue_callback( \WP_REST_Request $request ): \WP_REST_Response {
		[$service, $order] = $this->parse_params( $request );
		return new \WP_REST_Response( $service->issue( $order ), 200 );
	}

	/**
	 * 做廢發票
	 *
	 * @param \WP_REST_Request $request 請求
	 *
	 * @return \WP_REST_Response 回應
	 */
	public function post_cancel_callback( \WP_REST_Request $request ): \WP_REST_Response {
		[$service, $order] = $this->parse_params( $request );
		return new \WP_REST_Response( $service->cancel( $order ), 200 );
	}


	/**
	 * 從請求體解析出服務 & 訂單
	 *
	 * @param \WP_REST_Request $request 請求體
	 *
	 * @return array{0: IService, 1: \WC_Order} 服務, 訂單
	 * @throws \Exception 解析失敗
	 */
	private function parse_params( \WP_REST_Request $request ): array {
		$body_params = $request->get_params();
		WP::include_required_params( $body_params, [ 'order_id', 'provider' ]);

		[
			'order_id' => $order_id,
			'provider' => $provider
		] = $body_params;

		$service = Services::from( $provider );

		if (!$service) {
			throw new \Exception("找不到服務提供商 {$provider}");
		}

		$order = \wc_get_order( $order_id );
		if (!$order instanceof \WC_Order) {
			throw new \Exception("找不到訂單 #{$order_id}");
		}

		return [ $service, $order ];
	}
}
