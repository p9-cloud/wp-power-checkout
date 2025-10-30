export const invoiceTypes = [
	{
		value: 'individual',
		label: '個人',
	},
	{
		value: 'company',
		label: '公司',
	},
	{
		value: 'donate',
		label: '捐贈',
	},
] as const

export const individuals = [
	{
		value: 'cloud',
		label: '雲端發票',
	},
	{
		value: 'barcode',
		label: '手機條碼',
	},
	{
		value: 'moica',
		label: '自然人憑證',
	},
] as const
