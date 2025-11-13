<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Interfaces;

interface IIntegration {

	/** @return self 取得實例 */
	public static function instance(): self;

	/** @return array 取得儲存在 db 的設定項 */
	public static function get_settings(): array;
}
