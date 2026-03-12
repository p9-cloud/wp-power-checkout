# Code Style & Conventions

## PHP
- PSR-4 autoloading under `J7\PowerPartner` namespace
- `declare(strict_types=1)` in all files
- SingletonTrait pattern for service classes
- PHPStan for static analysis, PHPCS for code style
- WordPress coding standards with some exceptions
- Type hints on all method signatures

## TypeScript/React
- Functional components with hooks
- Jotai for state management
- Refine.dev patterns for CRUD
- Ant Design components
- SCSS for styling
- ESLint + Prettier

## Naming
- PHP: PascalCase classes, snake_case methods/variables
- TS: camelCase variables/functions, PascalCase components
- Constants: UPPER_SNAKE_CASE
- Meta keys: snake_case with prefix (pp_, power_partner_)
