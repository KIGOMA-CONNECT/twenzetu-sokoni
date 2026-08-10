# AfriMarket

> **Twenzetu Sokoni** — the trusted commerce platform of Africa. Born in Tanzania, engineered to global standards, and organized as **Enterprise Suites**, not standalone modules.

AfriMarket is a live, multi-tenant marketplace platform. It connects buyers, vendors, and service providers across web, Android (Trusted Web Activity), and USSD. The platform is structured to scale into a family of Enterprise Suites — Marketplace, Identity, Payments, Analytics, and beyond — governed by a single [Constitution](docs/constitution/README.md).

## Enterprise documentation

- **[The Constitution](docs/constitution/README.md)** — identity, vision, mission, values, engineering/architecture/product principles, governance, decision framework, and the future. The most important document in the project.
- **[Enterprise Suites](docs/enterprise-suites.md)** — how the platform is organized into suites and measured with maturity levels (L0–L7).
- **[Engineering Institute](docs/engineering-institute.md)** — research, architecture, certification, and training: the knowledge ecosystem of the platform.
- **[Documentation home](docs/README.md)**

## Repository structure

The monorepo is the seed of the platform (an [Nx workspace](https://nx.dev)).

| Area | Path | Role |
|---|---|---|
| API | `apps/api` | NestJS API, the composed product (suites + applications) |
| Web | `apps/web` | React SPA — the web channel |
| Android | `android/` | TWA wrapper for the Play Store |
| Suites | `libs/` | Suite-oriented libraries: `identity`, `marketplace`, `tenancy`, `ussd`, `integrations`, `core-*`, `database`, `kernel` |

## Quickstart

```sh
npm install
npm run serve        # run the API locally
npx nx build web     # build the web app
npm run build        # build all projects
npm run lint         # lint all projects
npm run test         # test all projects
```

Database migrations and seeds:

```sh
npm run migration:run
npm run seed
```

## Deployment

Production runs from containers (`docker-compose.prod.yml`) behind nginx on commodity infrastructure. Auto-deploy pulls the default branch and runs `./deploy.sh`. Production boot fails fast unless required secrets are present (see `.env.example`).

## Security & environment notes

- **Swagger UI** (`/docs`) is served whenever `APP_ENV` is not `production` and `SWAGGER_ENABLED` is not `'false'`. It is **never** exposed in production. To disable it in a non-production deployment (e.g. staging), set `SWAGGER_ENABLED=false`.
- **Startup secret validation**: the API exits immediately on boot when running as `production` unless `JWT_SECRET`, `PAYMENT_CONFIRM_SECRET`, `WEBHOOK_INTERNAL_SECRET`, and `METRICS_SECRET` are all set. Use `docker-compose.prod.yml` with a populated `.env` (see `.env.example`).
- **CI hardening**: the GitHub Actions workflow runs a full monorepo lint+test scan, a gitleaks secret scan (hard fail), `npm audit` (report-only), an SBOM generation step, and CodeQL analysis. Never commit `.env`, certs, or keys — see `.gitignore`.

> **Tracked follow-up — dependency upgrades**: `react-router` 7.18.1 has a HIGH RSC-CSRF advisory (GHSA) that is only fixed in the breaking 8.x line; deliberately deferred to a dedicated upgrade PR (touches all web routing). `js-yaml@5.2.1` via `@nestjs/swagger` is also flagged HIGH but has no production exposure since Swagger is disabled in production. All other open `npm audit` findings are dev/build-tooling only. Re-enable the audit job as a hard gate once these upgrades land.

> **Accepted residual — `image-size`**: flagged HIGH (build-time only, via `less` → `@nx/webpack`); no patched version exists and it is not shipped to production. Revisit when `less`/`@nx/webpack` publish a fixed dependency chain.
