<?php

declare(strict_types=1);

namespace J7\PowerCheckout\Shared\Enums;

/**
 * Shopline Payment Mode
 */
enum Mode: string {
	/** 測試模式 */
	case TEST = 'test';
	/** 正式模式 */
	case PROD = 'prod';
}
