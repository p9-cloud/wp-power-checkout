<?php

declare( strict_types = 1 );

namespace J7\PowerCheckout\Domains\Invoice\Shared\Utils;

use J7\PowerCheckout\Domains\Invoice\Shared\Interfaces\IService;
use J7\PowerCheckout\Domains\Settings\DTOs\IntegrationDTO;

/** Invoice Utils */
abstract class InvoiceUtils {

	/** @var array<string, IService> 存放已啟用服務的容器  */
	public static array $container = [];

	/** @var string 註冊電子發票 hook name */
	public const REGISTER_INVOICES_HOOK_NAME = 'power_checkout_register_invoices';

	/** @return IService|null 取得實例  */
	public static function get_invoice_instance( string $id ): ?IService {
		return self::$container[ $id ] ?? null;
	}


	/** @return IntegrationDTO[] 取得全部電子發票的 integration dtos */
	public static function get_registered_integration_dtos(): array {
		$classes = self::get_registered_services();
		return \array_map( static fn( $class_name ) => IntegrationDTO::create( $class_name), $classes );
	}


	/** @return array<string, string> 回傳 power_checkout 註冊的 invoices [id, class] */
	public static function get_registered_services(): array {
		return \apply_filters( self::REGISTER_INVOICES_HOOK_NAME, [] );
	}

	/**
	 * 取得設定
	 *
	 * @param string $id 電子發票 id
	 *
	 * @return array
	 */
	public static function get_settings( string $id ): array {
		$option_name = self::get_option_name( $id );
		return (array) \get_option( $option_name, [] );
	}


	/**
	 * 該電子發票是否已啟用
	 *
	 * @param string $id 電子發票 id
	 *
	 * @return bool
	 */
	public static function is_enabled( string $id ): bool {
		$setting = self::get_settings( $id );
		$enabled = $setting['enabled'] ?? 'no';
		return 'yes' === $enabled;
	}

	/** @return string 儲存在 wp_option 的 option_name */
	private static function get_option_name( string $id ): string {
		return "power_checkout_{$id}_settings";
	}
}
