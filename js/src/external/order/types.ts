export interface IOrderData {
    "gateway": {
        "id": string
        "method_title": string
    },
    "order": {
        "id": string
        "total": string
        "remaining_refund_amount": string
    }
}

export const DEFAULT_ORDER_DATA: IOrderData = {
    "gateway": {
        "id": "",
        "method_title": "API"
    },
    "order": {
        "id": "",
        "total": "",
        "remaining_refund_amount": ""
    }
}