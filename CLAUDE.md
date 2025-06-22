# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Phialo Design**, a luxury jewelry portfolio website built with Astro 5.9.3 using Islands Architecture. The site features German/English multilingual support and is deployed on Cloudflare Pages at `phialo.de`.

## Common Development Commands

```bash
# Development
npm run dev                 # Start dev server on localhost:4321
npm run build              # Build for production
npm run preview            # Preview production build locally

# Testing
npm run test               # Run tests in watch mode
npm run test:run           # Run tests once
npm run test:ui            # Run tests with UI

# Deployment
npm run deploy             # Deploy to Cloudflare Pages production
npm run deploy:preview     # Deploy to Cloudflare Pages preview
```

## Development Environment

- The developer instance is running locally in another shell with "npm run dev" at http://localhost:4321/
- If dev server is not on http://localhost:4321/, run the website on http://localhost:4322/ for dev purposes. If the site is not reachable then interrupt and get it from the user.

## Architecture Overview

### Core Stack
- **Astro 5.9.3**: Static site generator with Islands Architecture
- **React 19.1.0**: For interactive components only (selective hydration)
- **Tailwind CSS 3.4.1**: Comprehensive design system with luxury brand tokens
- **TypeScript**: Strict configuration with Astro defaults
- **Vitest**: Testing with React Testing Library

### Directory Structure
```
phialo-design/src/
├── components/
│   ├── common/          # Shared UI components (AnimatedText, Button)
│   ├── layout/          # Layout components (Header, Footer, Navigation, LanguageSelector)
│   ├── portfolio/       # Portfolio-specific components
│   └── sections/        # Page sections (Hero, Services, Tutorials)
├── content/             # Content collections (portfolio, tutorials)
├── layouts/             # Astro layout templates
├── pages/               # File-based routing
├── styles/              # Global styles and design system
└── test/                # Comprehensive test suite
```

### Component Patterns
- **`.astro` files**: Use for static, SEO-critical content that doesn't require interactivity
- **`.tsx` files**: Use for interactive features requiring client-side JavaScript
- Components in `components/common/` are shared across the site
- Layout components handle site structure and navigation

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
- See [ISSUE-22-FIX.md](./phialo-design/ISSUE-22-FIX.md) for detailed example

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
- Also possible to deploy via instructions from `DEPLOY.md` to get more debug data via web browsing
- Security headers configured in `public/_headers`
- CSP allows YouTube embeds
- Both production and preview environments available

## Key Files to Understand

- `astro.config.mjs`: Core Astro configuration with React/Tailwind integration
- `tailwind.config.mjs`: Complete design system definition
- `src/content/config.ts`: Content collections schema
- `src/components/layout/LanguageSelector.astro`: Handles language switching
- `public/_headers`: Security and caching configuration

## AI Development Guidelines

- Use parallel sub agents as much and as effectively as possible

## CLI Tools

- Use the `gh` command as a pre auth CLI command for github topics like issues, configuring agents

## GitHub Workflow

- Always solve issues from GitHub in branches and make PRs
- Work with feature branches preferably linking them to GitHub issues using the `gh` command
- Leave clean git status results after work by pushing open files in their respective branches

## Browser Automation

- Use playwright and **NEVER** use pupeteer or other browser automation tools

## Script Development Best Practices

- Always use a linter when editing deployment scripts, e.g. yml files for github workflows