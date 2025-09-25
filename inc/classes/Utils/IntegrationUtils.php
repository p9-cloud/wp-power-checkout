<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Utils;

use J7\PowerCheckout\Shared\DTOs\IntegrationDTO;
use J7\PowerCheckout\Domains\Settings\Services\SettingTabService;
use J7\PowerCheckout\Shared\Abstracts\BaseRegisterIntegration;
use J7\WpUtils\Classes\General;

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
		unset(self::$integrations[ $integration->integration_key ]);

		$new_integration = new IntegrationDTO(\wp_parse_args( self::get_settings($integration->integration_key), $integration->to_array()));

		self::$integrations[ $new_integration->integration_key ] = $new_integration;
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

		$key = $class_name::$integration_key;

		$integration = new IntegrationDTO(
			\wp_parse_args(
				self::get_settings($key),
				[
					'integration_key'        => $key,
					'integration_class_name' => $class_name,
					'setting_key'            => $class_name::$setting_key,
					'name'                   => $class_name::$name,
					'description'            => $class_name::$description,
					'icon_url'               => $class_name::$icon_url,
					'domain_type'            => $domain_type,
				]
				)
		);
		if (isset(self::$integrations[ $key ])) {
			throw new \Exception("Integration {$key} already exists");
		}
		self::$integrations[ $key ] = $integration;
	}


	/**
	 * @param string $value 要查找比對的值
	 * @parma string $key_name 要查找的IntegrationDTO 的屬性名稱
	 *
	 * @return IntegrationDTO
	 * @throws \Exception 如果找不到 Integration
	 */
	public static function find_integration( string $value, string $key_name = 'setting_key' ): IntegrationDTO {
		$integrations = self::get_integrations();
		/** @var IntegrationDTO|null $integration */
		$integration = General::array_find( $integrations, static fn( $i ) => $i->$key_name === $value );

		if (null ===$integration) {
			throw new \Exception("Can't find Integration with {$value} {$key_name}");
		}
		return $integration;
	}
}
