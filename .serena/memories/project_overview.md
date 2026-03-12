# Power Partner - Project Overview

## Purpose
Power Partner is a WordPress plugin (WooCommerce extension) that enables partners to sell website templates. When a customer purchases a WooCommerce subscription product linked to a template site, the system automatically provisions a WordPress site (via WPCD legacy or PowerCloud new architecture) and sends credentials to the customer. It also manages license codes (LC) lifecycle tied to subscriptions.

## Tech Stack
- **Backend**: PHP 8.1+, WordPress, WooCommerce, Woo Subscriptions, Action Scheduler
- **Frontend**: React 18 + TypeScript 5.8, Vite, Ant Design 5, Refine.dev, TanStack Query, Jotai (state)
- **Dependencies**: Powerhouse (core plugin), WooCommerce, Woo Subscriptions

## Codebase Structure
- `plugin.php` - Entry point, Plugin class with SingletonTrait
- `inc/classes/` - PHP backend classes (PSR-4 autoload under `J7\PowerPartner`)
  - `Api/` - REST API endpoints (Main, Connect, User, Fetch, FetchPowerCloud)
  - `Domains/Email/` - Email scheduling and sending (SubscriptionEmailHooks, SubscriptionEmailScheduler)
  - `Domains/LC/` - License code lifecycle (Api, LifeCycle, ExpireHandler)
  - `Domains/Site/` - Site disable/enable scheduling (DisableHooks, DisableSiteScheduler)
  - `Domains/Settings/` - Settings watch hooks for rescheduling
  - `Domains/Subscription/` - Subscription utilities
  - `Product/` - Product data tabs (LinkedSites, LinkedLC, SiteSync)
  - `Utils/` - Base utilities, Token replacement
- `js/src/` - React TypeScript frontend (125+ files)
  - `pages/AdminApp/` - Admin dashboard (Settings, EmailSetting, SiteList, LicenseCodes, etc.)
  - `pages/UserApp/` - Frontend user app (SiteList, LicenseCodes)
  - `components/` - Shared components (SiteListTable, LicenseCodes, SubscriptionSelect)
  - `api/` - API layer (axios, resources CRUD)
  - `hooks/` - Custom React hooks
- `spec/` - Specifications (es.md, api.yml, erm.dbml, .feature files)

## Key Domain Concepts
1. **Site Sync**: Auto-provision WordPress sites on subscription first payment
2. **License Codes (LC)**: Auto-create/expire/recover license codes tied to subscriptions
3. **Subscription Lifecycle**: Handle failed/success transitions (schedule disable/enable sites & LCs)
4. **Email Scheduling**: Send emails based on subscription lifecycle events with configurable timing
5. **Partner Connection**: Link to cloud.luke.cafe partner account for API access
6. **Dual Architecture**: Support both WPCD (legacy) and PowerCloud (new) hosting backends
