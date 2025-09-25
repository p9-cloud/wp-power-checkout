<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Shared\DTOs;

use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;
use J7\PowerCheckout\Shared\Abstracts\BaseRegisterIntegration;
use J7\PowerCheckout\Shared\Enums\DomainType;
use J7\WpUtils\Classes\DTO;
use J7\PowerCheckout\Utils\IntegrationUtils;

/**
 * Integration DTO
 *  */
final class IntegrationDTO extends DTO {

	/** @var string* Integration KEY 唯一識別 */
	public string $integration_key;

	/** @var string integration_class_name */
	public string $integration_class_name;

	/** @var string* Setting KEY 儲存在 option_name 的 key */
	public string $setting_key;

	/** @var string* Integration 名稱 */
	public string $name;

	/** @var string Integration 描述 */
	public string $description = '';

	/** @var string Integration 圖示 URL */
	public string $icon_url = '';

	/** @var bool 是否啟用 */
	public bool $enabled = false;

	/** @var string 領域類型 DomainType::value */
	public string $domain_type;

	/** @return void 切換 Integration 開關 */
	public function toggle(): void {
		$settings                           = SettingTabService::get_settings();
		$settings[ $this->integration_key ] = [
			'enabled' => !$this->enabled,
		];
		SettingTabService::save_settings($settings);
		$this->invalidate();
	}

	/** @return void invalidate  */
	public function invalidate(): void {
		IntegrationUtils::invalidate($this);
	}

	/** @return BaseRegisterIntegration */
	public function get_registered_integration(): BaseRegisterIntegration {
		return new $this->integration_class_name();
	}


	/**
	 *  驗證 Integration Key
	 *
	 *  @throws \Exception 如果錯誤
	 *  @noinspection PhpExpressionResultUnusedInspection
	 */
	protected function validate(): void {
		// 用 regex 判斷 $key 是否包含 A-Za-z0-9_
		if (!\preg_match('/^[A-Za-z0-9_]+$/', $this->integration_key)) {
			throw new \Exception('integration $key 只能包含英文數字以及底線');
		}

		DomainType::from( $this->domain_type);
	}


	/** @return array 輸出給前端 */
	public function to_array(): array {
		$array = parent::to_array();
		unset($array['integration_class_name']);
		return $array;
	}
}
