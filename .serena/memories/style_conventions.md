# Code Style & Conventions

## PHP
- PSR-4 autoloading under `J7\PowerCheckout` namespace (test: `J7\PowerCheckoutTests`)
- `declare(strict_types=1)` in every file (mandatory)
- `final class` by default (PHPCS enforced) — only omit when inheritance is required
- PHP 8.1+ features: enum, readonly, named args, match expression
- PHPStan level 9 — all issues must be resolved
- PHPCS: WordPress coding standards with relaxations (Yoda conditions disabled, short array syntax required, camelCase properties allowed, tabs for indent)
- Text domain: `'power_checkout'` (underscore, NEVER hyphen)
- Hook callbacks: always static methods `[__CLASS__, 'method']` — never closures or instance methods (exception: `register_checkout_blocks` needs `self::ID`)
- Exception handling: catch `\Throwable`, log via `Plugin::logger()`, never expose internals to frontend
- Singletons use `SingletonTrait` from wp-utils
- DTOs use `::create(array $data)` factory; settings DTOs are singletons merging WC options
- REST API services extend `ApiBase` (wp-utils); callback naming `{method}_{endpoint_with_underscores}_callback`

## Vue 3 (Main Frontend)
- `<script setup lang="ts">` — Composition API only, NO Options API
- `@/` alias for all imports (resolves to `js/src/`), never relative paths
- Element Plus only — no other UI libraries (NOT Ant Design, NOT Vuetify)
- TanStack Vue Query defaults: `staleTime: 15min`, `retry: 0`, `refetchOnWindowFocus: false`
- API access via `apiClient` from `@/api/index.ts` (auto X-WP-Nonce + ElNotification interceptor)
- Do NOT manually trigger `ElNotification` for API responses — interceptor handles it
- Env access only via `@/utils/env.ts`, never read `window` directly

## React (WC Blocks Only)
- TypeScript with JSX, each `inc/assets/blocks/*.tsx` is a separate Vite entry point
- External WP/WC globals via `vite-plugin-optimizer` — `@woocommerce/*`, `@wordpress/*` resolved from `window.wc`/`window.wp`
- Do NOT add WP/WC packages as npm deps — they are shimmed
- Type declarations in `inc/assets/blocks/types/types.d.ts`

## HPOS (Orders)
- Never use `get_post_meta()` for orders — use `$order->get_meta()` / `$order->update_meta_data()`
- `OrderUtils::is_order_detail($hook)` for hook screen detection
- MetaBox registration: both `shop_order` and `woocommerce_page_wc-orders`

## Naming
- PHP: PascalCase classes, snake_case methods (but DTO properties camelCase matching SLP API)
- TS: camelCase variables/functions, PascalCase components
- Constants: UPPER_SNAKE_CASE
- Order meta keys: snake_case with `pc_` prefix (`pc_payment_identity`, `pc_issued_data`, `pc_provider_id`, etc.)
- WC options: `woocommerce_{provider_id}_settings`

## Testing
- Base class: `J7\PowerCheckoutTests\Shared\WC_UnitTestCase` extends `WP_UnitTestCase`
- `@Create` PHP attribute auto-instantiates fixtures (Order, Product, User, Requester) via `$this->get_container()`
- API_MODE env var: `mock` | `sandbox` | `prod`
- Playwright E2E in `tests/e2e/` with own `package.json`
