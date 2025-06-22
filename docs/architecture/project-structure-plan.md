# Phialo Design - Project Structure Plan

## Overview

This document outlines the recommended project structure for the Phialo Design website using Astro. The structure follows Astro best practices while maintaining clarity and scalability for the minimalist elegance design.

## Directory Structure

```
phialo-design/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Shared components
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   └── AnimatedSection.tsx
│   │   ├── layout/         # Layout components
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Navigation.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── sections/       # Page section components
│   │   │   ├── Hero.astro
│   │   │   ├── Portfolio.tsx
│   │   │   ├── Services.astro
│   │   │   ├── Tutorials.astro
│   │   │   └── Contact.tsx
│   │   └── portfolio/      # Portfolio-specific components
│   │       ├── PortfolioGrid.tsx
│   │       ├── PortfolioItem.tsx
│   │       ├── PortfolioFilter.tsx
│   │       └── PortfolioOverlay.tsx
│   │
│   ├── layouts/            # Page layouts
│   │   ├── BaseLayout.astro
│   │   ├── PageLayout.astro
│   │   └── TutorialLayout.astro
│   │
│   ├── pages/              # Route pages
│   │   ├── index.astro     # Homepage
│   │   ├── portfolio/      # Portfolio pages
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── services/       # Service pages
│   │   │   ├── index.astro
│   │   │   ├── 3d-design.astro
│   │   │   ├── visualization.astro
│   │   │   └── prototyping.astro
│   │   ├── tutorials/      # Tutorial pages
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   └── 404.astro
│   │
│   ├── content/            # Content collections
│   │   ├── portfolio/      # Portfolio items (Markdown/MDX)
│   │   │   ├── ewigkeit-ring.md
│   │   │   ├── moderne-kette.md
│   │   │   └── kunst-brosche.md
│   │   ├── tutorials/      # Tutorial content
│   │   │   ├── grundlagen-3d-design.mdx
│   │   │   └── schmuck-rendering.mdx
│   │   └── config.ts       # Content collection config
│   │
│   ├── styles/             # Global styles and design tokens
│   │   ├── global.css      # Global styles
│   │   ├── tokens.css      # Design tokens (colors, spacing, etc.)
│   │   ├── typography.css  # Typography system
│   │   ├── animations.css  # Animation utilities
│   │   └── utilities.css   # Utility classes
│   │
│   ├── assets/             # Static assets (processed by Astro)
│   │   ├── images/         # Images (will be optimized)
│   │   │   ├── portfolio/
│   │   │   ├── hero/
│   │   │   └── icons/
│   │   └── fonts/          # Self-hosted fonts
│   │       ├── playfair-display/
│   │       ├── inter/
│   │       └── montserrat/
│   │
│   ├── lib/                # Utility functions and helpers
│   │   ├── utils.ts        # General utilities
│   │   ├── animations.ts   # Animation helpers
│   │   ├── seo.ts          # SEO utilities
│   │   └── constants.ts    # App constants
│   │
│   └── types/              # TypeScript type definitions
│       ├── portfolio.ts
│       ├── content.ts
│       └── global.d.ts
│
├── public/                 # Static files (served as-is)
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml         # Generated
│   └── social/             # OG images
│
├── scripts/                # Build scripts
│   └── generate-og-images.js
│
├── astro.config.mjs        # Astro configuration
├── tsconfig.json           # TypeScript config
├── postcss.config.cjs      # PostCSS config
├── package.json
├── .env.example            # Environment variables template
├── .gitignore
└── README.md               # Project documentation
```

## Component Architecture

### 1. **Astro Components** (`.astro`)
Used for static, SEO-critical components:
- Layout components (Header, Footer)
- Static sections (Hero, Services)
- Page templates

### 2. **React Components** (`.tsx`)
Used for interactive elements:
- Portfolio filter and grid
- Navigation with animations
- Contact form with validation
- Interactive animations

### 3. **Component Patterns**

```astro
---
// Hero.astro - Example of Astro component
import { Image } from 'astro:assets';
import AnimatedText from './AnimatedText.tsx';

export interface Props {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

const { title, subtitle, ctaText, ctaLink } = Astro.props;
---

<section class="hero">
  <div class="hero-bg" />
  <div class="hero-content">
    <AnimatedText client:load>
      <h1>{title}</h1>
    </AnimatedText>
    <p class="hero-subtext">{subtitle}</p>
    <a href={ctaLink} class="hero-cta">{ctaText}</a>
  </div>
</section>

<style>
  /* Component-scoped styles */
  .hero {
    /* Styles from mockup */
  }
</style>
```

## Asset Management Strategy

### 1. **Images**
- Store in `src/assets/images/`
- Use Astro's Image component for optimization
- Naming convention: `[section]-[description]-[variant].jpg`
- Example: `portfolio-ewigkeit-ring-thumb.jpg`

### 2. **Fonts**
- Self-hosted in `src/assets/fonts/`
- Loaded via Fontsource in layouts
- Preloaded for performance

### 3. **Icons**
- React: Lucide React icons
- Custom SVGs in `src/assets/images/icons/`

## Content Management

### 1. **Portfolio Items**
Location: `src/content/portfolio/`

```markdown
---
title: "Ewigkeit Ring"
category: "Verlobungsringe"
featuredImage: "./images/ewigkeit-ring-hero.jpg"
gallery:
  - "./images/ewigkeit-ring-detail-1.jpg"
  - "./images/ewigkeit-ring-detail-2.jpg"
materials: ["18k Gold", "Diamanten"]
techniques: ["3D Design", "Handarbeit"]
featured: true
order: 1
---

Beschreibung des Schmuckstücks...
```

### 2. **Tutorials**
Location: `src/content/tutorials/`

```mdx
---
title: "Grundlagen des 3D Schmuckdesigns"
duration: "45 min"
level: "Anfänger"
thumbnail: "./images/tutorial-basics-thumb.jpg"
publishedAt: 2024-01-15
tags: ["3D Design", "Grundlagen"]
---

import VideoPlayer from '../../components/VideoPlayer.tsx';

# Einführung

<VideoPlayer client:load src="/videos/intro.mp4" />

Lernen Sie die Grundlagen...
```

## Integration of Existing Mockup

### Phase 1: Style Extraction
1. Extract design tokens from `version1-mockup.html`:
   - Colors → `src/styles/tokens.css`
   - Typography → `src/styles/typography.css`
   - Spacing/sizing → CSS custom properties

### Phase 2: Component Migration
1. Break down mockup into components:
   - Header → `src/components/layout/Header.astro`
   - Hero → `src/components/sections/Hero.astro`
   - Portfolio → `src/components/sections/Portfolio.tsx`
   - Services → `src/components/sections/Services.astro`
   - Footer → `src/components/layout/Footer.astro`

### Phase 3: Enhancement
1. Add missing pages (About, individual portfolio items)
2. Implement interactive features:
   - Portfolio filtering
   - Smooth scroll animations
   - Form functionality
   - Mobile menu

## Build Configuration

### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://phialo.design',
  integrations: [
    react(),
    sitemap(),
    compress()
  ],
  image: {
    domains: ['phialo.design'],
  },
  vite: {
    css: {
      postcss: './postcss.config.cjs'
    }
  }
});
```

## Development Workflow

### 1. **Component Development**
- Start with Astro components for structure
- Add React components for interactivity
- Use Storybook for component isolation (optional)

### 2. **Content Workflow**
- Markdown files for portfolio/tutorials
- Type-safe content collections
- Git-based content management

### 3. **Styling Approach**
- Component-scoped styles in Astro
- CSS Modules for React components
- Global utilities for common patterns

### 4. **Performance Optimization**
- Lazy load images below fold
- Preload critical fonts
- Minimize JavaScript hydration
- Use Astro's built-in optimizations

## Deployment Structure

### Build Output
```
dist/
├── _astro/          # Bundled assets (hashed)
├── portfolio/       # Static portfolio pages
├── services/        # Static service pages
├── tutorials/       # Static tutorial pages
├── index.html       # Homepage
├── about/index.html
├── contact/index.html
├── favicon.ico
├── robots.txt
└── sitemap.xml
```

### Environment Variables
```env
PUBLIC_SITE_URL=https://phialo.design
PUBLIC_CONTACT_EMAIL=info@phialo.design
PUBLIC_GTM_ID=GTM-XXXXXX
```

## Next Steps

1. **Initialize Astro project** with TypeScript template
2. **Set up design system** (tokens, typography, components)
3. **Create base layouts** and common components
4. **Migrate mockup styles** to component structure
5. **Implement content collections** for portfolio
6. **Add interactive features** progressively
7. **Optimize for performance** and SEO
8. **Deploy to Vercel/Netlify** with CI/CD

This structure provides a solid foundation that:
- Maintains the minimalist elegance aesthetic
- Supports component reusability
- Enables easy content management
- Ensures optimal performance
- Allows for future scaling