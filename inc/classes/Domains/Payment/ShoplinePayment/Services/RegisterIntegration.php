<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\ShoplinePayment\Services;

use J7\PowerCheckout\Shared\Abstracts\BaseRegisterIntegration;
use J7\PowerCheckout\Shared\Enums\DomainType;
use J7\PowerCheckout\Utils\IntegrationUtils;

/**
 * Payment Integrations (API 為 base)
 * 整合不同的 Payment Gateway
 * 例如 ECPayAIO 裡面有 ATM, Credit, CVS 等等 Payment Gateway
 */
final class RegisterIntegration extends BaseRegisterIntegration {

	/** @var string* Integration KEY 唯一識別 */
	public static string $key = 'shopline_payment';

	/** @var string* Integration 名稱 */
	public static string $name = 'Shopline Payment';

	/** @var string Integration 描述 */
	public static string $description = '';

	/** @var string Integration 圖示 URL */
	public static string $icon_url = 'https://img.shoplineapp.com/media/image_clips/62297669a344ad002979d725/original.png';

	/** Register hooks */
	public static function register_hooks(): void {
		IntegrationUtils::register(__CLASS__, DomainType::PAYMENTS->value);
		RegisterGateway::register_hooks();
	}
}
