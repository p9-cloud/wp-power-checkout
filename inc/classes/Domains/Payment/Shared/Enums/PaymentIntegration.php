<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\Shared\Enums;

use J7\PowerCheckout\Domains\Settings\DTOs\IntegrationDTO;
use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;
use J7\PowerCheckout\Shared\Enums\DomainType;

/**
 * Payment Integration (以 API 為 base)
 *  */
enum PaymentIntegration: string {

	private const FILTER_KEY = 'power_checkout_payment_integrations';

	case SHOPLINE_PAYMENT = 'shopline_payment';
	case ECPAY_AIO        = 'ecpay_aio';

	/** @return void 切換 Integration 開關 */
	public function toggle(): void {
		$settings                 = SettingTabService::get_settings();
		$integration              = $this->get_integration();
		$settings[ $this->value ] = [
			'enabled' => !$integration->enabled,
		];
		SettingTabService::save_settings($settings);
		$this->invalidate();
	}

	/** @return IntegrationDTO 取得 Integration */
	public function get_integration(): IntegrationDTO {
		$integrations = self::get_integrations();
		if (isset($integrations[ $this->value ]) && $integrations[ $this->value ] instanceof IntegrationDTO) {
			return $integrations[ $this->value ];
		}
		return $this->register();
	}

	/** @return array<string, IntegrationDTO> 取得 Integration */
	public static function get_integrations(): array {
		return \apply_filters( self::FILTER_KEY, [] );
	}

	/** @return IntegrationDTO 註冊 Integration */
	public function register(): IntegrationDTO {
		$settings = SettingTabService::get_settings();

		$integration = new IntegrationDTO(
			[
				'key'         => $this->value,
				'name'        => $this->label(),
				'description' => $this->description(),
				'icon_url'    => $this->icon(),
				'domain_type' => DomainType::PAYMENTS->value,
				'enabled'     => isset($settings[ $this->value ]) && $settings[ $this->value ]['enabled'] ?? false,
			]
		);
		$key         = $this->value;
		\add_filter(
			self::FILTER_KEY,
			static function ( $integrations ) use ( $integration, $key ) {
				$integrations[ $key ] = $integration;
				return $integrations;
			}
		);

		return $integration;
	}

	/** @return string 取得 label */
	public function label(): string {
		return match ( $this ) {
			self::SHOPLINE_PAYMENT => 'Shopline Payment',
			self::ECPAY_AIO        => 'EcPay | 綠界金流',
		};
	}

	/** @return string 取得 description */
	public function description(): string {
		return match ( $this ) {
			default => '',
		};
	}

	/** @return string 取得 icon 圖片 */
	public function icon(): string {
		return match ( $this ) {
			self::SHOPLINE_PAYMENT => 'https://img.shoplineapp.com/media/image_clips/62297669a344ad002979d725/original.png',
			self::ECPAY_AIO        => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMTjo4Y8SMNcXz0ZSm5Bg92fqHYYTICRTwPw&s',
		};
	}

	/** @return void invalidate */
	public function invalidate(): void {
		$key = $this->value;
		\add_filter(
			self::FILTER_KEY,
			static function ( $integrations ) use ( $key ) {
				$integrations[ $key ] = null;
				return $integrations;
			}
		);
	}
}
