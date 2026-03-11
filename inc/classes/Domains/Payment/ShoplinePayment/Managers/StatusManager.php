<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Managers;

use J7\PowerCheckout\Domains\Payment\Shared\Enums\OrderStatus;
use J7\PowerCheckout\Domains\Payment\Shared\Helpers\MetaKeys;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Trade\Payment\PaymentDTO;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\ResponseStatus;


/**
 * StatusManager
 * 依照付款回應，改變訂單狀態
 * */
final class StatusManager {

	/** Constructor */
	public function __construct( private readonly PaymentDTO $_response_dto, private readonly \WC_Order $order ) {
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
		$payment_detail_html = $this->_response_dto->to_human_html();
		$this->order->add_order_note($payment_detail_html);
		( new MetaKeys($this->order) )->update_payment_detail($this->_response_dto->to_array() );

		$status_enum  = ResponseStatus::tryFrom($this->_response_dto->status);
		$order_status = match ( $status_enum ) {
			ResponseStatus::SUCCEEDED => OrderStatus::PROCESSING,
			ResponseStatus::EXPIRED => OrderStatus::CANCELLED,
			// EventType::SESSION_PENDING,
			// EventType::SESSION_CREATED,
			default => OrderStatus::PENDING,
		};

		$this->order->update_status($order_status->value);
	}
}
