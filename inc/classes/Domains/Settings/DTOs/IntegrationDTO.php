<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Settings\DTOs;

use J7\PowerCheckout\Shared\Enums\DomainType;
use J7\WpUtils\Classes\DTO;

/**
 * Integration DTO
 *  */
final class IntegrationDTO extends DTO {

	/** @var string* Integration KEY 唯一識別 */
	public string $key;

	/** @var string* Integration 名稱 */
	public string $name;

	/** @var string Integration 描述 */
	public string $description = '';

	/** @var string Integration 圖示 URL */
	public string $icon_url = '';

	/** @var bool 是否啟用 */
	public bool $enabled = false;

	/** @var 'payments'|'shippings'|'invoices' 領域類型  DomainType::value */
	protected string $domain_type;

	/**
	 *  驗證 Integration Key
	 *
	 *  @throws \Exception 如果錯誤
	 *  @noinspection PhpExpressionResultUnusedInspection
	 */
	protected function validate(): void {
		// 用 regex 判斷 $key 是否包含 A-Za-z0-9_
		if (!\preg_match('/^[A-Za-z0-9_]+$/', $this->key)) {
			throw new \Exception('integration $key 只能包含英文數字以及底線');
		}

		DomainType::from( $this->domain_type);
	}
}
