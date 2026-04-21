# Suggested Commands

## Setup
- `pnpm bootstrap` - pnpm install + composer install (first time)

## Frontend Dev (Vue 3 Main App)
- `pnpm dev` - Vite dev server on port 5182 (Settings SPA + RefundDialog + InvoiceApp)
- `pnpm build` - Production build to `js/dist/`

## Frontend Dev (React WC Blocks)
- `pnpm dev:blocks` - Watch mode on port 5181 for block checkout integration
- `pnpm build:blocks` - Production build to `inc/assets/dist/blocks/`

## Code Quality
- `pnpm lint` - ESLint (frontend) + PHPCBF
- `pnpm lint:fix` - Auto-fix frontend + PHPCBF
- `composer lint` - PHPCS only
- `vendor/bin/phpstan analyse` - PHPStan level 9

## PHP Testing (requires WP test DB — see phpunit.xml)
- `composer test` - PHPUnit with API_MODE=mock (default, safe for CI)
- `composer test:sandbox` - PHPUnit with API_MODE=sandbox
- `composer test:prod` - PHPUnit with API_MODE=prod (caution)
- `vendor/bin/phpunit --filter ClassName` - Run single test class
- `vendor/bin/phpunit --filter "test_method_name"` - Run single test method

## E2E Testing (Playwright, separate package.json)
- `cd tests/e2e && npm install` - First-time install
- `cd tests/e2e && npx playwright test` - Run all E2E tests
- `cd tests/e2e && npx playwright test --grep "settings"` - Filter by keyword

## Release (requires .env with GITHUB_TOKEN)
- `pnpm release` - Patch release (builds Vue + Blocks, zips, GitHub release)
- `pnpm release:minor` - Minor release
- `pnpm release:major` - Major release
- `pnpm zip` - Create plugin zip only
- `pnpm sync:version` - Sync package.json version → plugin.php header
- `pnpm i18n` - Generate .pot translation template

## System Utils (Windows, Git Bash)
- `git`, `ls`, `grep`, `find` via Git Bash
- Shell: bash (Unix syntax, `/dev/null` not `NUL`, forward slashes)
