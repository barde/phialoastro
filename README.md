# Phialo Design

A luxury jewelry portfolio website built with Astro, React, and TypeScript. Features multilingual support and is deployed on Cloudflare Pages.

## 🚀 Quick Start

### Prerequisites

This repository uses Git LFS (Large File Storage) for managing images and other binary files. **You must install Git LFS before cloning:**

```bash
# Install Git LFS
brew install git-lfs  # macOS
# or
sudo apt-get install git-lfs  # Ubuntu/Debian

# Initialize Git LFS
git lfs install
```

### Setup

```bash
# Clone the repository (Git LFS files will be downloaded automatically)
git clone https://github.com/barde/phialoastro.git
cd phialoastro

# If you already cloned without LFS, pull the LFS files
git lfs pull

# Install dependencies
cd phialo-design
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## 🛠️ Tech Stack

- **[Astro](https://astro.build/)** - Static site generator with Islands Architecture
- **[React](https://react.dev/)** - Interactive UI components
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling with custom design system
- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Hosting and edge functions

## 📁 Project Structure

```
phialoastro/
├── phialo-design/          # Main application
│   ├── src/               # Source code
│   │   ├── features/      # Feature-based modules
│   │   ├── shared/        # Shared components
│   │   ├── content/       # Content collections
│   │   ├── pages/         # Routes
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   ├── tests/             # E2E tests
│   └── dist/              # Build output
├── docs/                  # Project documentation
│   ├── getting-started/   # Tutorials
│   ├── how-to/           # Guides
│   ├── architecture/      # Design docs
│   ├── decisions/         # ADRs
│   └── mockups/          # Design mockups
└── workers/               # Cloudflare Workers

```

## ✨ Features

- **Portfolio Gallery** - Filterable showcase of jewelry designs
- **Multilingual** - German/English support with automatic detection
- **Performance Optimized** - Static generation with selective hydration
- **Responsive Design** - Mobile-first approach
- **Contact Forms** - Integrated with email API and Turnstile protection
- **Tutorial Section** - Educational content for jewelry design

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Environment Setup

For complete environment setup instructions, see **[Environment Setup Guide](./phialo-design/docs/how-to/ENVIRONMENT-SETUP-GUIDE.md)**.

### Quick Deploy

### Environments

- **Production**: [phialo.de](https://phialo.de) - Custom domain
- **Master Branch**: [phialo-master.meise.workers.dev](https://phialo-master.meise.workers.dev) - Latest master branch
- **PR Previews**: `https://phialo-pr-{number}.meise.workers.dev` - Ephemeral per PR

The site uses automatic deployments:
- PRs get temporary preview environments
- Master branch deploys to phialo-master worker
- Production deployments are manual

### Required GitHub Secrets

Before deploying, ensure these secrets are configured in your repository:

```bash
# Cloudflare API credentials
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID

# Email configuration
RESEND_API_KEY
FROM_EMAIL
TO_EMAIL

# Turnstile CAPTCHA protection
PUBLIC_TURNSTILE_SITE_KEY    # Site key (public, used during build)
TURNSTILE_SECRET_KEY         # Secret key (confidential, for validation)
```

For production deployment on phialo.de:
- Site Key: `0x4AAAAAABqCQ4FwHKMUuQnB`
- Secret Key: Obtain from Cloudflare Dashboard

See [Turnstile Production Setup](./phialo-design/docs/how-to/configure-turnstile-production.md) for detailed configuration.

### Deploy Commands

```bash
# Deploy to production (requires zone permissions)
npm run deploy

# Deploy to preview (workers.dev)
npm run deploy:preview
```

## 📚 Documentation

- [Project Structure](./docs/architecture/project-structure.md) - Architecture overview
- [Development Guide](./phialo-design/README.md) - Detailed development instructions
- [Deployment Instructions](./docs/how-to/DEPLOYMENT_INSTRUCTIONS.md) - Deployment configuration
- [Turnstile Pre-clearance Setup](./phialo-design/docs/how-to/setup-turnstile-preclearance.md) - Security configuration
- [AI Development Guide](./CLAUDE.md) - Guidelines for AI-assisted development

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project uses a dual licensing approach:

- **Source Code**: Licensed under [GNU AGPLv3](./LICENSE-CODE)
- **Creative Assets**: Licensed under [CC BY-NC-ND 4.0](./LICENSE-ASSETS)

See [LICENSE.md](./LICENSE.md) for detailed information.

For commercial licensing inquiries, please contact info@phialo.de.

© 2025 Phialo Design. All rights reserved.

## 🙏 Acknowledgments

This project is tested with [BrowserStack](https://www.browserstack.com/)

## 🔗 Links

- **Production**: [phialo.de](https://phialo.de)
- **Issues**: [GitHub Issues](https://github.com/barde/phialoastro/issues)
