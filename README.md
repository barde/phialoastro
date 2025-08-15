# 🎨 Phialo Design

> **Luxury jewelry portfolio showcasing exquisite craftsmanship through modern web technology**

[![Version](https://img.shields.io/badge/version-1.0.0-gold.svg)](https://github.com/barde/phialoastro/releases)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE-CODE)
[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-orange)](https://phialo.de)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

A luxury jewelry portfolio website built with cutting-edge web technologies, featuring multilingual support (German/English), responsive design, and deployed on Cloudflare Workers for optimal global performance.

🌐 **Live Site**: [phialo.de](https://phialo.de)

## ✨ Key Features

- 🏛️ **Luxury Design System** - Glass morphism effects, elegant animations, and premium typography
- 🌍 **Multilingual Support** - Seamless German/English language switching with automatic detection
- 📱 **Responsive Architecture** - Mobile-first design that adapts beautifully to all screen sizes
- 🚀 **Optimized Performance** - Static site generation with selective hydration (Astro Islands)
- 🔒 **Security First** - Cloudflare Turnstile CAPTCHA protection with pre-clearance support
- 📧 **Contact Integration** - Fully functional contact form with Resend email service
- 🎨 **Portfolio Showcase** - Filterable gallery with smooth animations
- 📚 **Tutorial Section** - Educational content for jewelry design enthusiasts

## 🛠️ Tech Stack

### Core Technologies
- **[Astro 5.12.9](https://astro.build/)** - Static site generator with Islands Architecture
- **[React 19.1.1](https://react.dev/)** - Interactive UI components with selective hydration
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 3.4.1](https://tailwindcss.com/)** - Utility-first CSS with custom design tokens

### Infrastructure
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge computing platform for global deployment
- **[pnpm 9.14.4](https://pnpm.io/)** - Fast, disk-efficient package manager
- **[Git LFS](https://git-lfs.github.com/)** - Efficient binary file management for images

### Development Tools
- **[Vitest 3.2.4](https://vitest.dev/)** - Lightning-fast unit testing
- **[Playwright 1.54.2](https://playwright.dev/)** - E2E testing across browsers
- **[ESLint 9.33.0](https://eslint.org/)** - Code quality enforcement
- **[Prettier 3.6.2](https://prettier.io/)** - Consistent code formatting

## 🚀 Quick Start

### Prerequisites

1. **Node.js 20+** and **pnpm 9.14.4**
   ```bash
   # Install pnpm globally
   npm install -g pnpm@9.14.4
   ```

2. **Git LFS** (Required for image assets)
   ```bash
   # macOS
   brew install git-lfs
   
   # Ubuntu/Debian
   sudo apt-get install git-lfs
   
   # Initialize Git LFS
   git lfs install
   ```

### Installation

```bash
# Clone the repository (Git LFS files download automatically)
git clone https://github.com/barde/phialoastro.git
cd phialoastro

# Install dependencies for main application
cd phialo-design
pnpm install

# Install dependencies for Cloudflare Workers
cd ../workers
pnpm install
```

### Development

```bash
# Start development server (from phialo-design/)
pnpm run dev
# Opens at http://localhost:4321

# Run both Astro and Workers in parallel
pnpm run dev:full
```

### Building & Testing

```bash
# Build for production
pnpm run build

# Run tests
pnpm run test          # Unit tests with Vitest
pnpm run test:e2e      # E2E tests with Playwright
pnpm run lint          # Lint code
pnpm run typecheck     # TypeScript checking
```

## 📁 Project Structure

```
phialoastro/
├── 📱 phialo-design/          # Main Astro application
│   ├── src/
│   │   ├── features/         # Feature-based modules
│   │   │   ├── portfolio/   # Portfolio showcase
│   │   │   ├── contact/     # Contact form
│   │   │   ├── services/    # Services pages
│   │   │   └── tutorials/   # Tutorial content
│   │   ├── shared/          # Shared components & layouts
│   │   ├── content/         # Content collections (Markdown)
│   │   ├── pages/           # File-based routing
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets (optimized images)
│   └── tests/               # Test suites
│
├── ⚡ workers/               # Cloudflare Workers
│   ├── src/
│   │   ├── router/         # Request routing
│   │   ├── handlers/       # API endpoints
│   │   └── middleware/     # Security & logging
│   └── wrangler.toml       # Worker configuration
│
└── 📚 docs/                 # Documentation
    ├── architecture/        # System design
    ├── decisions/          # ADRs
    └── how-to/            # Guides
```

## 🌍 Deployment Environments

| Environment | URL | Deployment | Purpose |
|------------|-----|------------|---------|
| **Production** | [phialo.de](https://phialo.de) | Manual via GitHub Actions | Live site with custom domain |
| **Master** | [phialo-master.meise.workers.dev](https://phialo-master.meise.workers.dev) | Automatic on push | Latest master branch |
| **PR Preview** | `phialo-pr-{number}.meise.workers.dev` | Automatic on PR | Isolated testing per PR |

### Required Secrets

Configure these in GitHub Settings → Secrets:

```yaml
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID      # Your account ID
CLOUDFLARE_API_TOKEN        # API token with Workers permissions
CLOUDFLARE_ZONE_ID          # Zone ID for phialo.de

# Email Service (Resend)
RESEND_API_KEY             # Resend API key
FROM_EMAIL                 # Sender email address
TO_EMAIL                   # Recipient for contact forms
REPLY_TO_EMAIL             # Optional reply-to address

# Security (Turnstile)
PUBLIC_TURNSTILE_SITE_KEY  # Public site key
TURNSTILE_SECRET_KEY       # Secret key for validation

# Analytics (Cloudflare Web Analytics)
PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN  # Web Analytics token for visitor metrics
```

### Deployment Commands

```bash
# Deploy to production (requires permissions)
cd workers
pnpm run deploy:production

# Deploy to preview environment
pnpm run deploy:preview

# Manual deployment via GitHub
# Use workflow dispatch or PR comment: /deploy
```

## 🧪 Testing Strategy

Our comprehensive testing ensures quality across all aspects:

- **Unit Tests**: Component logic and utilities (Vitest)
- **Integration Tests**: Feature workflows
- **E2E Tests**: User journeys (Playwright)
- **Visual Tests**: UI consistency
- **Performance Tests**: Core Web Vitals monitoring
- **Accessibility Tests**: WCAG compliance

```bash
# Run all tests
pnpm run test:run

# Run with UI
pnpm run test:ui

# Run E2E with debugging
pnpm run test:e2e:debug

# Coverage report
pnpm run test:unit:coverage
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm run pre-push`)
5. Commit with descriptive message
6. Push to your fork
7. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project uses a dual licensing approach:

- **Source Code**: [GNU AGPLv3](./LICENSE-CODE) - Open source with copyleft
- **Creative Assets**: [CC BY-NC-ND 4.0](./LICENSE-ASSETS) - Attribution, non-commercial, no derivatives

For commercial licensing, contact: info@phialo.de

## 📚 Documentation

- 🏗️ [Architecture Overview](./docs/architecture/project-structure.md)
- 🚀 [Deployment Guide](./phialo-design/docs/how-to/DEPLOY.md)
- 🔐 [Security Setup](./phialo-design/docs/how-to/setup-turnstile-preclearance.md)
- 🤖 [AI Development Guide](./CLAUDE.md)
- 📱 [Component Patterns](./docs/decisions/component-patterns.md)
- 🌍 [Multilingual Implementation](./docs/decisions/ISSUE-22-FIX.md)

## 🙏 Acknowledgments

- Tested with [BrowserStack](https://www.browserstack.com/)
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com/)
- Email service by [Resend](https://resend.com/)

## 📞 Contact

- **Website**: [phialo.de](https://phialo.de)
- **Email**: info@phialo.de
- **GitHub Issues**: [Report bugs or request features](https://github.com/barde/phialoastro/issues)

---

<p align="center">
  Made with ❤️ by Phialo Design<br>
  © 2025 Phialo Design. All rights reserved.
</p>
