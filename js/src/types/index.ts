export interface IGateway {
    integration_key: string
    setting_key: string
    name: string
    description?: string
    icon_url?: string
    enabled?: boolean
    domain_type?: 'payments' | 'invoices'
}