<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Enums;

enum DomainType: string {

	case PAYMENTS  = 'payments';
	case SHIPPINGS = 'shippings';
	case INVOICES  = 'invoices';
}
