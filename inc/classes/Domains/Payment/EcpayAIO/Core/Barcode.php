<?php

declare (strict_types = 1);

namespace J7\PowerCheckout\Domains\Payment\EcpayAIO\Core;

use J7\PowerCheckout\Domains\Payment\EcpayAIO\Abstracts\PaymentGateway;

/** Barcode */
final class Barcode extends PaymentGateway {
	/** @var string 付款方式 ID */
	const ID = Init::PREFIX . 'barcode';

	/** @var string 付款方式 ID */
	public $id = self::ID;

	/** @var string 付款方式類型 (自訂，用來區分付款方式類型) ChoosePayment 參數 */
	public string $payment_type = 'BARCODE';

	/** Constructor */
	public function __construct() {
		$this->title = __( 'ECPayAIO Barcode', 'power_checkout' );
		parent::__construct();
	}

	/**
	 * 過濾表單欄位
	 *
	 * @param array<string, mixed> $fields 表單欄位
	 * @return array<string, mixed> 過濾後的表單欄位
	 * */
	public function filter_fields( array $fields ): array {
		$fields['expire_date'] = [
			'title'             => __( 'Payment deadline', 'power_checkout' ),
			'type'              => 'decimal',
			'default'           => 7,
			'placeholder'       => 7,
			'description'       => __( 'Barcode allowable payment deadline from 1 day to 60 days.', 'power_checkout' ),
			'custom_attributes' => [
				'min'  => 1,
				'max'  => 30,
				'step' => 1,
			],
		];
		return $fields;
	}

	/**
	 * 不同的 gateway 會有不同的自訂 request params
	 *
	 * @return array<string, mixed>
	 */
	public function extra_request_params(): array {
		return [
			'StoreExpireDate' => $this->expire_date,
		];
	}

	/**TODO
	 * 應該是要作取號後，馬上跳轉感謝頁，不過應該不用這麼繞才對
	 * Get the return url (thank you page).
	 *
	 * @param \WC_Order|null $order Order object.
	 * @return string
	 */
	public function get_return_url( $order = null ) {
		$return_url = WC()->api_request_url('ry_ecpay_gateway_return');
		if ($order) {
			$return_url = add_query_arg('id', $order->get_id(), $return_url);
			$return_url = add_query_arg('key', $order->get_order_key(), $return_url);
		}

		return $return_url;
	}


	/**
	 * [後台] 自訂欄位驗證邏輯
	 * 可以用 \WC_Admin_Settings::add_error 來替欄位加入錯誤訊息
	 * 個人/商務賣家：訂單金額需介於 31元(含)~6,000元(含)，方可建立訂單。
	 * 特約賣家：訂單金額需介於31元(含)~20,000元(含)，方可建立訂單。
	 *
	 * @see https://support.ecpay.com.tw/4804/
	 * @see WC_Settings_API::process_admin_options
	 * @return bool was anything saved?
	 */
	public function process_admin_options(): bool {

		// 取得 $_POST 的指定欄位 name
		$expire_date_name = $this->get_field_key( 'expire_date' );
		$min_amount_name  = $this->get_field_key( 'min_amount' );
		$max_amount_name  = $this->get_field_key( 'max_amount' );

		// 解構，不存在就會是 null
		@[
			$expire_date_name => $expire_date,
			$min_amount_name  => $min_amount,
			$max_amount_name  => $max_amount,
		] = $this->get_post_data();

		$expire_date = (int) $expire_date;
		$min_amount  = (float) $min_amount;
		$max_amount  = (float) $max_amount;

		if ( $expire_date < 1 || $expire_date > 30 ) {
			$this->errors[] = __( 'Save failed. Barcode payment deadline out of range.', 'power_checkout' );
		}

		if ($min_amount < 31 ) {
			$this->errors[] = sprintf( __( 'Save failed. %s minimum amount out of range.', 'power_checkout' ), $this->method_title );
		}

		if ( $max_amount > 20000 ) {
			$this->errors[] = sprintf( __( 'Save failed. %s maximum amount out of range.', 'power_checkout' ), $this->method_title );
		}

		if ( $this->errors ) {
			$this->display_errors();
			return false;
		}

		return parent::process_admin_options();
	}

	/** TODO
	 * [Admin] 在後台 order detail 頁地址下方顯示資訊
	 */
	public function render_after_billing_address( \WC_Order $order ): void {
		if ( $order->get_payment_method() !== $this->id ) {
			return;
		}
		?>
<h3 style="clear:both"><?php echo __( 'Payment details', 'ry-woocommerce-tools' ); ?>
</h3>
<table>
	<tr>
		<td><?php echo __( 'Barcode 1', 'ry-woocommerce-tools' ); ?>
		</td>
		<td><?php echo esc_html( (string) $order->get_meta( '_ecpay_barcode_Barcode1' ) ); ?>
		</td>
	</tr>
	<tr>
		<td><?php echo __( 'Barcode 2', 'ry-woocommerce-tools' ); ?>
		</td>
		<td><?php echo esc_html( (string) $order->get_meta( '_ecpay_barcode_Barcode2' ) ); ?>
		</td>
	</tr>
	<tr>
		<td><?php echo __( 'Barcode 3', 'ry-woocommerce-tools' ); ?>
		</td>
		<td><?php echo esc_html( (string) $order->get_meta( '_ecpay_barcode_Barcode3' ) ); ?>
		</td>
	</tr>
	<tr>
		<td><?php echo __( 'Payment deadline', 'ry-woocommerce-tools' ); ?>
		</td>
		<td><?php echo esc_html( (string) $order->get_meta( '_ecpay_barcode_ExpireDate' ) ); ?>
		</td>
	</tr>
</table>
		<?php
	}
}
