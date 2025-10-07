<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Managers;

use J7\PowerCheckout\Domains\Payment\Shared\Enums\OrderStatus;
use J7\PowerCheckout\Domains\Payment\Shared\Params;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Payment\RequestParamsGet;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Payment\ResponseParams;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks\Body;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks\Payment;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks\Session;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\EventType;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\ResponseStatus;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\ResponseSubStatus;
use J7\WpUtils\Classes\DTO;
use J7\WpUtils\Classes\WP;


/**
 * StatusManager
 * */
final class StatusManager {

	/** @var DTO|null 付款詳情*/
	private readonly DTO|null $_payment_detail; // phpcs:ignore

	/** Constructor */
	public function __construct( private readonly ResponseParams $_response_dto, private readonly \WC_Order $_order ) {
		$this->_payment_detail = $this->get_payment_detail();
	}


	/**
	 * 依照 API 回應狀態不同的轉換不同的訂單狀態
	 * 付款成功  => 處理中
	 * 付款失敗  => 等待付款中
	 * 逾時未付  => 取消
	 * 退款成功 => 退款
	 *
	 * @return void
	 */
	public function update_order_status(): void {
		$response_dto    = $this->_response_dto;
		$status_enum     = ResponseStatus::from($response_dto->status);
		$sub_status_enum = null;
		if (isset( $response_dto->subStatus)) {
			$sub_status_enum = ResponseSubStatus::from( $response_dto->subStatus);
		}

		$title = \sprintf(
			'%1$s 付款狀態：%2$s %3$s <br> 付款方式：%4$s',
			$status_enum->emoji(),
			$status_enum->label(),
			$sub_status_enum?->label() ?? '',
			$response_dto->payment->paymentMethod
		);

		if ($this->_payment_detail) {
			/** @var DTO $payment_detail_dto */
			$payment_detail_dto   = $this->_payment_detail;
			$payment_detail_array = $payment_detail_dto?->to_array();
			$payment_detail_html  = WP::array_to_html($payment_detail_array, [ 'title' => $title ]);
			$this->_order->add_order_note($payment_detail_html);
			$this->_order->update_meta_data( Params::PAYMENT_DETAIL_KEY, $this->_response_dto->payment->to_array() );
			$this->_order->save_meta_data();
		} else {
			$this->_order->add_order_note($title);
		}

		$order_status = match ( $status_enum ) {
			ResponseStatus::SUCCEEDED => OrderStatus::PROCESSING,
			ResponseStatus::EXPIRED => OrderStatus::CANCELLED,
			// EventType::SESSION_PENDING,
			// EventType::SESSION_CREATED,
			default => OrderStatus::PENDING,
		};

		$this->_order->update_status($order_status->value);
	}



	/**
	 * 取得付款詳情
	 *
	 * @return DTO|null
	 */
	private function get_payment_detail(): DTO|null {
		$response_dto = $this->_response_dto;

		if (isset($response_dto->payment->creditCard)) {
			return $response_dto->payment->creditCard;
		}

		if (isset($response_dto->payment->virtualAccount)) {
			return $response_dto->payment->virtualAccount;
		}

		if (isset($response_dto->payment->paymentInstrument)) {
			return $response_dto->payment->paymentInstrument;
		}
		if (isset($response_dto->payment->paymentMethodOptions)) {
			return $response_dto->payment->paymentMethodOptions;
		}

		return null;
	}
}
