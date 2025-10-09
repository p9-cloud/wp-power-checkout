<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Abstracts;

use J7\PowerCheckout\Domains\Payment\ShoplinePayment\DTOs\RedirectSettingsDTO;
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
}
