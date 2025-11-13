<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Settings\DTOs;

/**
 * 整合 Dto
 */
final class IntegrationDTO {

	/** @var string $id Id */
	public string $id = '';

	/** @var string $icon Icon */
	public string $icon = '';

	/** @var string $enabled 是否啟用 yes|no */
	public string $enabled = 'no';

	/** @var string $method_title 標題 */
	public string $method_title = '';

	/** @var string $method_description 描述 */
	public string $method_description = '';


	/**
	 * @param string $class_name 物流、電子發票類別
	 *
	 * @return self
	 */
	public static function create( string $class_name ): self {
		$settings_array = \call_user_func( [ $class_name , 'get_settings' ]);
		return new self($settings_array);
	}
}
