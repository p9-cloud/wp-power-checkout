<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Abstracts;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\SettingsDTO;
use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;

abstract class BaseRegisterIntegration {
	/** @var string* Integration KEY 唯一識別 */
	public static string $integration_key;

	/** @var string* Setting_key KEY 唯一識別 */
	public static string $setting_key;

	/** @var string* Integration 名稱 */
	public static string $name;

	/** @var string Integration 描述 */
	public static string $description;

	/** @var string Integration 圖示 URL */
	public static string $icon_url;

	/** Register hooks */
	abstract public static function register_hooks(): void;

	/** 儲存，可以部分更新
	 *
	 * @param array $data 儲存這個 integration data
	 * @return void
	 * @throws \Exception 如果驗證失敗
	 */
	abstract public static function save_settings( array $data ): void;


	/** @return array 取得設定 */
	public static function get_settings(): array {
		$data = SettingTabService::get_settings( self::$setting_key );
		return ( new SettingsDTO( $data) )->to_array();
	}
}
