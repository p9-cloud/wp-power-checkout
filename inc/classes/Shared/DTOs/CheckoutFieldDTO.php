<?php

declare( strict_types = 1 );

namespace J7\PowerCheckout\Shared\DTOs;

use J7\PowerCheckout\Plugin;
use J7\PowerCheckout\Shared\Utils\CheckoutFields;
use J7\WpUtils\Classes\DTO;

/**
 * 結帳欄位 DTO
 * 用此 DTO 搭配 CheckoutFields 可以新增欄位，需要在 CheckoutFields 呼叫 register_hooks 之前
 */
final class CheckoutFieldDTO extends DTO {

	/** @var string 欄位ID */
	public string $id;

	/** @var string 欄位標籤 */
	public string $label;

	/** @var string 欄位類型 */
	public string $field_type = 'billing'; // billing or shipping

	/** @var string 輸入類型 */
	public string $type = 'text';  // or 'select' or 'checkbox'

	/** @var string 代替文字 */
	public string $placeholder = '';  // or 'select' or 'checkbox'

	/** @var bool 是否必填 */
	public bool $required = false;

	/** @var array CSS類名 */
	public array $class_name = [ 'form-row-wide' ];

	/** @var int 優先級 */
	public int $priority = 200;

	/** @var string 欄位位置 */
	public string $location = 'address';  // or 'contact' or 'order'


	/** 註冊欄位 */
	public function register(): void {
		CheckoutFields::register_field($this);
	}


	/**
	 * @return array
	 */
	public function to_traditional_checkout_args(): array {
		$array = $this->to_array();
		unset($array['field_type']);
		unset($array['location']);
		$array['class'] = $array['class_name'];
		unset($array['class_name']);
		return $array;
	}

	/**
	 * @return array
	 * @see https://developer.woocommerce.com/docs/block-development/tutorials/how-to-additional-checkout-fields-guide/#text-fields
	 */
	public function to_block_checkout_args(): array {
		$array = $this->to_array();
		unset($array['field_type']);
		unset($array['priority']);
		unset($array['class_name']);
		unset($array['placeholder']);
		// id 必須帶上斜線 namespace power-checkout/field-id 否則無法使用
		$array['id'] = Plugin::$kebab . '/' . $array['id'];
		return $array;
	}
}
