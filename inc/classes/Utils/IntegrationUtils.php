<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Utils;

use J7\PowerCheckout\Shared\DTOs\IntegrationDTO;
use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;
use J7\PowerCheckout\Shared\Abstracts\BaseRegisterIntegration;

/**
 * Integration 工具類
 */
abstract class IntegrationUtils {

	/** @var array<string, IntegrationDTO> */
	protected static array $integrations = [];

	/** @return IntegrationDTO|null 取得 Integration */
	public static function get_integration( string $key ): IntegrationDTO|null {
		$integrations = self::get_integrations();
		if (isset($integrations[ $key ]) && $integrations[ $key ] instanceof IntegrationDTO) {
			return $integrations[ $key ];
		}
		return null;
	}

	/** @return array<string, IntegrationDTO> 取得 Integration */
	public static function get_integrations(): array {
		return self::$integrations;
	}

	/** @return void invalidate  */
	public static function invalidate( IntegrationDTO $integration ): void {
		unset(self::$integrations[ $integration->key ]);

		$new_integration = new IntegrationDTO(\wp_parse_args(self::get_settings($integration->key), $integration->to_array()));

		self::$integrations[ $new_integration->key ] = $new_integration;
	}

	/**
	 * 只拿取儲存在 DB 中的 integrations 設定 array
	 *
	 * @param string $key Key
	 *
	 * @return array{enabled: bool}
	 */
	protected static function get_settings( string $key ): array {
		$settings = SettingTabService::get_settings();
		return [
			'enabled' => isset($settings[ $key ]) && $settings[ $key ]['enabled'] ?? false,
		];
	}

	/**
	 * @param class-string<BaseRegisterIntegration> $class_name 類別名稱
	 * @param string                                $domain_type 網域類型
	 * @return void 註冊 Integration
	 */
	public static function register( string $class_name, string $domain_type ): void {

		$key = $class_name::$key;

		$integration = new IntegrationDTO(
			\wp_parse_args(
				self::get_settings($key),
				[
					'key'         => $key,
					'name'        => $class_name::$name,
					'description' => $class_name::$description,
					'icon_url'    => $class_name::$icon_url,
					'domain_type' => $domain_type,
				]
				)
		);

		self::$integrations[ $key ] = $integration;
	}
}
