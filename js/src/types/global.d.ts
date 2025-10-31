import { IOrderData } from '@/external/order/types'

export {}

export interface IEnv {
	SITE_URL: string
	API_URL: string
	CURRENT_USER_ID: number
	CURRENT_POST_ID: number
	PERMALINK: string
	APP_NAME: string
	KEBAB: string
	SNAKE: string
	NONCE: string
	APP1_SELECTOR: string
	IS_LOCAL: boolean
}

declare global {
	interface Window {
		power_checkout_data: {
			env: IEnv
		} // 或更精確的型別
		power_checkout_order_data: IOrderData
	}
}
