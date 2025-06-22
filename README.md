# Phialo Design

A luxury jewelry portfolio website built with Astro, React, and TypeScript. Features multilingual support and is deployed on Cloudflare Pages.

## 🚀 Quick Start

```bash
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
│   └── decisions/         # ADRs
├── mockups/               # Design mockups
├── tests/                 # Project-wide tests
├── scripts/               # Build scripts
├── config/                # Configuration
└── workers/               # Cloudflare Workers

```

## ✨ Features

- **Portfolio Gallery** - Filterable showcase of jewelry designs
- **Multilingual** - German/English support with automatic detection
- **Performance Optimized** - Static generation with selective hydration
- **Responsive Design** - Mobile-first approach
- **Contact Forms** - Integrated with Web3Forms
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

The site is automatically deployed to Cloudflare Pages on push to main branch.

```bash
# Deploy to production
npm run deploy

# Deploy preview
npm run deploy:preview
```

## 📚 Documentation

- [Project Structure](./docs/architecture/project-structure.md) - Architecture overview
- [Development Guide](./phialo-design/README.md) - Detailed development instructions
- [Deployment Instructions](./docs/how-to/DEPLOYMENT_INSTRUCTIONS.md) - Deployment configuration
- [AI Development Guide](./CLAUDE.md) - Guidelines for AI-assisted development

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

© 2025 Phialo Design. All rights reserved.

## 🔗 Links

- **Production**: [phialo.de](https://phialo.de)
- **Issues**: [GitHub Issues](https://github.com/barde/phialoastro/issues)