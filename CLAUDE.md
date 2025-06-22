# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Phialo Design**, a luxury jewelry portfolio website built with Astro 5.9.3 using Islands Architecture. The site features German/English multilingual support and is deployed on Cloudflare Pages at `phialo.de`.

## Common Development Commands

```bash
# Install dependencies (use pnpm for faster, more efficient installs)
pnpm install               # Install all dependencies

# Development
pnpm run dev               # Start dev server on localhost:4321
pnpm run build             # Build for production
pnpm run preview           # Preview production build locally

# Testing
pnpm run test              # Run tests in watch mode
pnpm run test:run          # Run tests once
pnpm run test:ui           # Run tests with UI

# Deployment
pnpm run deploy            # Deploy to Cloudflare Pages production
pnpm run deploy:preview    # Deploy to Cloudflare Pages preview

# Maintenance
./scripts/clean-project.sh # Remove .DS_Store and other junk files
```

## Development Environment

- The developer instance is running locally in another shell with "pnpm run dev" at http://localhost:4321/
- If dev server is not on http://localhost:4321/, run the website on http://localhost:4322/ for dev purposes. If the site is not reachable then interrupt and get it from the user.

## Architecture Overview

### Core Stack
- **Astro 5.9.3**: Static site generator with Islands Architecture
- **React 19.1.0**: For interactive components only (selective hydration)
- **Tailwind CSS 3.4.1**: Comprehensive design system with luxury brand tokens
- **TypeScript**: Strict configuration with Astro defaults
- **Vitest**: Testing with React Testing Library

### Feature-Based Architecture
The project follows a feature-based architecture where functionality is organized by business domain rather than technical layers. Each feature is self-contained with its own components, pages, types, and styles. This improves maintainability, scalability, and team collaboration.

### Directory Structure
```
phialoastro/
├── phialo-design/                  # Main application
│   ├── src/
│   │   ├── features/              # Feature-based modules
│   │   │   ├── portfolio/         # Portfolio feature
│   │   │   ├── services/          # Services feature
│   │   │   ├── tutorials/         # Tutorials feature
│   │   │   ├── contact/           # Contact feature
│   │   │   ├── about/             # About feature
│   │   │   ├── legal/             # Legal pages
│   │   │   └── home/              # Home page components
│   │   ├── shared/                # Shared resources
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── navigation/        # Header, Footer, Navigation
│   │   │   └── layouts/           # Page layouts
│   │   ├── content/               # Content collections
│   │   ├── pages/                 # File-based routing
│   │   ├── styles/                # Global styles
│   │   └── test/                  # Test suite
│   ├── public/                    # Static assets
│   └── tests/                     # E2E tests
├── docs/                          # Project documentation
│   ├── architecture/              # System design & concepts
│   ├── decisions/                 # Architectural decisions
│   ├── getting-started/           # Tutorials
│   ├── how-to/                    # Guides
│   └── mockups/                   # Design mockups
│       ├── initial-designs/       # Original v1-v3 designs
│       └── issue-47-learning-portal/ # Learning portal mockups
└── workers/                       # Cloudflare Workers
```

### Component Patterns
- **`.astro` files**: Use for static, SEO-critical content that doesn't require interactivity
- **`.tsx` files**: Use for interactive features requiring client-side JavaScript
- Feature-specific components live in `src/features/[feature]/components/`
- Shared UI components are in `src/shared/components/ui/`
- Navigation components are in `src/shared/navigation/`
- Layout templates are in `src/shared/layouts/`

### Content Management
- Content collections defined in `src/content/config.ts` provide type-safe content
- Portfolio items and tutorials are managed as markdown files
- Use Astro's content collections API for querying and rendering content

## Multilingual System

The site uses a custom URL-based multilingual system for German/English support:
- LanguageSelector component handles language switching with localStorage persistence
- German is the default language (served at root `/`)
- English content is served under `/en/` prefix
- Language preference persists across page navigation

### Important Notes on React Hydration
- Portfolio and other React components use URL-based language detection
- Always handle hydration mismatches with useState/useEffect pattern
- Use `useMemo` for language-dependent data that needs to be reactive
- See [ISSUE-22-FIX.md](./docs/decisions/ISSUE-22-FIX.md) for detailed example

## Design System

Tailwind configuration includes:
- **Color Palette**: Luxury brand colors (primary, secondary, accent, neutral)
- **Typography**: Playfair Display (headings), Inter (body), custom font scale
- **Animations**: Custom keyframes for luxury aesthetics
- **Glass Effects**: Custom utilities for frosted glass UI elements

## Testing Approach

- Tests located in `src/test/` directory
- Use Vitest with React Testing Library for component testing
- Test files should mirror component structure
- Focus on user interactions and accessibility

## Performance Considerations

- Astro's Islands Architecture minimizes JavaScript shipping
- Use React components sparingly - only for true interactivity
- Static generation provides optimal performance
- Images are optimized through Astro's image service

## Deployment

- Deployed on **Cloudflare Pages** with automatic builds from git
- Also possible to deploy via instructions from [DEPLOY.md](./docs/how-to/DEPLOY.md) to get more debug data via web browsing
- Security headers configured in `public/_headers`
- CSP allows YouTube embeds
- Both production and preview environments available

## Key Files to Understand

- `astro.config.mjs`: Core Astro configuration with React/Tailwind integration
- `tailwind.config.mjs`: Complete design system definition
- `src/content/config.ts`: Content collections schema
- `src/shared/navigation/LanguageSelector.astro`: Handles language switching
- `public/_headers`: Security and caching configuration

## Documentation

Project documentation is organized in the `docs/` directory:
- **`architecture/`**: System design, project structure, and design concepts
- **`decisions/`**: Architectural decision records and issue resolutions
- **`getting-started/`**: Tutorials and onboarding guides
- **`how-to/`**: Step-by-step guides for common tasks

## AI Development Guidelines

- Use parallel sub agents as much and as effectively as possible

## CLI Tools

- Use the `gh` command as a pre auth CLI command for github topics like issues, configuring agents

## GitHub Workflow

- Always solve issues from GitHub in branches and make PRs
- Work with feature branches preferably linking them to GitHub issues using the `gh` command
- Leave clean git status results after work by pushing open files in their respective branches
- Always check the post push build run results on feature branches by using the gh cli. don't report successful work until the build passes.

## Browser Automation

- Use playwright and **NEVER** use pupeteer or other browser automation tools

## Script Development Best Practices

- Always use a linter when editing deployment scripts, e.g. yml files for github workflows

## Project Maintenance & Cleanliness

- **No junk files**: The project must be kept clean of system files (.DS_Store, Thumbs.db, etc.)
- **No empty directories**: Remove any empty folders that serve no purpose
- **Use cleanup script**: Run `./scripts/clean-project.sh` regularly to maintain cleanliness
- **Gitignore enforcement**: All system/temporary files must be in .gitignore
- **Clean structure**: Follow the documented directory structure strictly