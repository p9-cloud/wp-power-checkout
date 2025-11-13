<?php /** @noinspection PhpMissingReturnTypeInspection */


declare ( strict_types = 1 );

namespace J7\PowerCheckout\Domains\Invoice\Shared\Abstracts;

/** 電子發票服務抽象類別單例模式 */
abstract class AbstractInvoiceService {

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
}
