# Project Structure Guide

This document describes the Phialo Design project structure after the comprehensive reorganization completed in June 2025.

## Overview

The project follows a modern **feature-based architecture** that groups related functionality together, making the codebase more maintainable, scalable, and easier to navigate.

## Directory Structure

```
phialoastro/
├── docs/                      # All documentation
│   ├── getting-started/       # Tutorials and onboarding
│   ├── how-to/               # Task-oriented guides
│   ├── architecture/         # System design docs
│   ├── api/                  # Reference documentation
│   └── decisions/            # Decision records
├── mockups/                  # Design mockups
│   ├── v1-v3/               # Original site mockups
│   └── learning-portal/      # Learning portal designs
├── phialo-design/            # Main project directory
│   ├── src/                  # Source code
│   │   ├── features/         # Feature-based modules
│   │   ├── shared/           # Shared components
│   │   ├── pages/            # Route definitions
│   │   └── content/          # Content collections
│   ├── tests/                # E2E tests
│   ├── public/               # Static assets
│   └── dist/                 # Build output
├── tests/                    # Project-wide tests
├── scripts/                  # Build/deployment scripts
├── config/                   # Configuration files
├── workers/                  # Cloudflare Workers module
└── CLAUDE.md                # AI assistant guidance
```

## Feature-Based Architecture

Each feature is self-contained with its own:
- Components
- Pages
- Types/interfaces
- Styles
- Assets
- Tests

### Example Feature Structure

```
src/features/portfolio/
├── components/               # Feature-specific components
│   ├── PortfolioGrid.tsx
│   ├── PortfolioFilter.tsx
│   ├── PortfolioItem.tsx
│   ├── PortfolioModal.tsx
│   └── PortfolioSection.tsx
├── pages/                    # Feature pages
│   └── index.astro
├── types/                    # TypeScript definitions
│   └── portfolio.ts
└── styles/                   # Feature-specific styles
    └── portfolio.css
```

## Shared Resources

```
src/shared/
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── AnimatedText.tsx
│   │   ├── Button.astro
│   │   ├── LazyImage.tsx
│   │   └── QualityBadge.astro
│   └── effects/              # Visual effects
│       ├── MagneticCursor.tsx
│       └── SmoothScroll.tsx
├── navigation/               # Site navigation
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Navigation.tsx
│   ├── MobileMenu.tsx
│   └── LanguageSelector.astro
├── layouts/                  # Page layouts
│   ├── BaseLayout.astro
│   ├── PageLayout.astro
│   └── TutorialLayout.astro
└── styles/                   # Global styles
    ├── global.css
    ├── theme.css
    └── tokens.css
```

## Documentation Organization

Following the Diátaxis framework:

- **Getting Started**: Tutorials for newcomers
- **How-To Guides**: Step-by-step instructions for specific tasks
- **Architecture**: Explanations of system design and decisions
- **API Reference**: Technical specifications
- **Decisions**: Records of architectural decisions

## Benefits of This Structure

1. **Feature Isolation**: Each feature is self-contained
2. **Clear Dependencies**: Easy to see what depends on what
3. **Better Testing**: Tests live alongside features
4. **Team Collaboration**: Teams can work on features independently
5. **Scalability**: New features don't clutter existing directories
6. **Maintainability**: Related code is grouped together

## Migration from Previous Structure

The migration involved:
- Moving from type-based to feature-based organization
- Consolidating documentation into a single location
- Merging duplicate mockup directories
- Cleaning up test artifacts
- Removing nested directory issues

## Working with the New Structure

### Adding a New Feature

1. Create a new directory under `src/features/`
2. Add subdirectories for components, pages, types, etc.
3. Import shared components from `src/shared/`
4. Add feature pages to routing

### Finding Components

- Feature-specific: `src/features/[feature]/components/`
- Shared UI: `src/shared/components/ui/`
- Navigation: `src/shared/navigation/`
- Layouts: `src/shared/layouts/`

### Import Paths

Use relative imports:
```typescript
// From a feature component
import Button from '../../shared/components/ui/Button.astro';
import PageLayout from '../../shared/layouts/PageLayout.astro';
```

## Conventions

1. **Component Names**: PascalCase (e.g., `PortfolioGrid.tsx`)
2. **File Organization**: Group by feature, not by type
3. **Shared vs Feature**: Only truly reusable components go in shared
4. **Test Location**: Unit tests alongside code, E2E tests in `tests/`
5. **Documentation**: All docs in the `docs/` directory

## Future Considerations

As the project grows, consider:
- Implementing module boundaries with lint rules
- Adding feature-specific documentation
- Creating feature templates
- Implementing dependency constraints