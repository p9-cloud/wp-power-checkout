<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Managers;

use J7\PowerCheckout\Domains\Payment\Shared\Enums\OrderStatus;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Enums\EventType;
use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\Webhooks;
use J7\WpUtils\Classes\DTO;


/**
 * EventTypeManager
 * */
final class EventTypeManager {

	/** Constructor */
	public function __construct( private EventType $event_type ) {
	}


	/**
	 * 依照事件類型不同的轉換不同的訂單狀態
	 * 付款失敗  => 等待付款中
	 * 逾時未付  => 取消
	 *
	 * @param \WC_Order $order 訂單
	 *
	 * @return void
	 */
	public function update_order_status( \WC_Order $order ): void {
		$order_status = match ( $this->event_type ) {
			EventType::SESSION_CREATED,
			EventType::SESSION_PENDING => OrderStatus::PENDING,
			EventType::SESSION_EXPIRED => OrderStatus::CANCELLED,
			EventType::SESSION_SUCCEEDED => OrderStatus::PROCESSING,
			default => null,
		};
		if ( !$order_status ) {
			return;
		}
		$order->add_order_note($this->event_type->label());
		$order->update_status($order_status->value);
	}


	/**
	 * 依照依照事件類型的 DTO
	 *
	 * @param array<string, mixed> $data 原始資料
	 * @return DTO 事件類型的 DTO
	 */
	public function get_dto( array $data ): DTO {
		return match ( $this->event_type ) {
			EventType::SESSION_CREATED,
			EventType::SESSION_EXPIRED,
			EventType::SESSION_PENDING,
			EventType::SESSION_SUCCEEDED => Webhooks\Session::create($data),
			EventType::TRADE_SUCCEEDED,
			EventType::TRADE_FAILED,
			EventType::TRADE_EXPIRED,
			EventType::TRADE_PROCESSING,
			EventType::TRADE_CANCELLED,
			EventType::TRADE_CUSTOMER_ACTION => Webhooks\Payment::create($data),
			EventType::TRADE_REFUND_SUCCEEDED,
			EventType::TRADE_REFUND_FAILED => Webhooks\Refund::create($data),
			EventType::CUSTOMER_CREATED,
			EventType::CUSTOMER_UPDATED,
			EventType::CUSTOMER_DELETED => Webhooks\Member::parse($data),
			EventType::CUSTOMER_INSTRUMENT_BINDED,
			EventType::CUSTOMER_INSTRUMENT_UPDATED,
			EventType::CUSTOMER_INSTRUMENT_UNBINDED => Webhooks\Instrument::create($data),
		};
	}
}
