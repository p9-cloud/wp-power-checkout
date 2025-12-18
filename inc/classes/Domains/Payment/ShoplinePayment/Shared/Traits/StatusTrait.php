<?php

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Shared\Traits;

trait StatusTrait {
	/** @var string Enums\ResponseStatus::value *結帳交易狀態 (16) */
	public string $status;

	/** @var string ResponseSubStatus::value *子付款狀態 (32) 參考，採用手動請款時需要關注此參數 */
	public string $subStatus;

	/** @return bool 是否為成功的狀態 */
	final public function is_successed(): bool {
		return $this->status === 'SUCCEEDED';
	}

	/** @return bool 是否為成功或失敗的狀態 */
	final public function is_successed_or_failed(): bool {
		return $this->status === 'SUCCEEDED' || $this->status === 'FAILED';
	}
}
