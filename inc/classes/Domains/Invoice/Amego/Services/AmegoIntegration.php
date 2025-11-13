<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Domains\Invoice\Amego\Services;

use J7\PowerCheckout\Domains\Invoice\Amego\DTOs\IssueInvoiceDTO;
use J7\PowerCheckout\Domains\Invoice\Shared\Abstracts\AbstractInvoiceService;
use J7\PowerCheckout\Domains\Invoice\Shared\Interfaces\IInvoiceService;
use J7\PowerCheckout\Domains\Invoice\Shared\Utils\InvoiceUtils;
use J7\PowerCheckout\Shared\Interfaces\IIntegration;
use J7\WpUtils\Classes\WP;

final class AmegoIntegration extends AbstractInvoiceService implements IIntegration, IInvoiceService {

	public const ID = 'amego';

	/** @var string $id Id */
	public string $id = self::ID;

	/** @var string $icon Icon */
	public string $icon = 'https://invoice-static.amego.tw/www/images/amego_1024_icon.png';

	/** @var string $method_title 標題 */
	public string $method_title = '光貿電子發票';

	/** @var string $method_description 描述 */
	public string $method_description = '光貿電子發票加值中心-電子發票系統，不綁約、無限制開立張數、月費199元開到飽。免費協助營業人快速申請用電子發票，並提供一般商家、各種電子商務系統、蝦皮、松果、雅虎、Pchome、露天、旋轉賣家輕鬆快速開立電子發票。';

	/** @var self|null $instance */
	private static ?self $instance = null;


	/**
	 * 記錄 log
	 * info, error, warning 會同步記錄到 order note
	 *
	 * @param string               $message     訊息
	 * @param string               $level       等級 info | error | alert | critical | debug | emergency | warning | notice
	 * @param array<string, mixed> $args        附加資訊
	 * @param int                  $trace_limit 追蹤堆疊層數
	 * @param \WC_Order|null       $order       是否紀錄在 order note
	 */
	public static function logger( string $message, string $level = 'debug', array $args = [], int $trace_limit = 0, \WC_Order|null $order = null ): void {
		\J7\WpUtils\Classes\WC::logger( $message, $level, $args, 'power_checkout_' . self::ID, $trace_limit );
		if (!$order) {
			return;
		}

		$order_note = WP::array_to_html( $args, [ 'title' => "{$message} <p style='margin-bottom: 0;'>&nbsp;</p>" ] );
		$order->add_order_note( $order_note );
	}

	public function issue( \WC_Order $order ): array {
		// TODO: Implement issue() method.

		$params = IssueInvoiceDTO::create($order);
		return [];
	}

	public function cancel( \WC_Order $order ): array {
		// TODO: Implement cancel() method.
		return [];
	}

	/** @return self 取得實例  */
	public static function instance(): self {
		if (!self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/** @return array 取得設定 */
	public static function get_settings(): array {
		return InvoiceUtils::get_settings( self::ID);
	}
}
