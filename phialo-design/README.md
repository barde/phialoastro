# Phialo Design - Luxury Jewelry Website

A modern, high-performance website built with Astro, React, and Tailwind CSS, showcasing the "Minimalist Elegance" design concept for Phialo Design's luxury jewelry and gemstone collection.

## 🌟 Features

- **Modern Stack**: Built with Astro 4.x, React 18, and Tailwind CSS 3.x
- **Performance Optimized**: Static site generation with partial hydration
- **Responsive Design**: Mobile-first approach with elegant desktop scaling
- **Accessibility**: WCAG 2.1 AA compliant with semantic HTML and ARIA labels
- **SEO Optimized**: Structured data, meta tags, and optimized images
- **Design System**: Comprehensive component library with consistent tokens
- **Content Collections**: Type-safe content management for portfolio and tutorials
- **Animation**: Smooth transitions and micro-interactions for enhanced UX

## 🎨 Design Concept

The website implements the "Version 1: Minimalist Elegance" design concept featuring:

- **Color Palette**: Sophisticated neutrals with luxury accent colors
- **Typography**: Playfair Display for headings, Inter for body text
- **Layout**: Clean, spacious layouts with strategic white space
- **Animation**: Subtle, purposeful animations that enhance the luxury feel
- **Photography**: Full-bleed hero images and asymmetric portfolio grid

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Basic components (Button, AnimatedText)
│   ├── layout/          # Layout components (Header, Footer, Navigation)
│   ├── portfolio/       # Portfolio-specific components
│   └── sections/        # Page sections (Hero, Services, Tutorials)
├── content/             # Content collections
│   ├── portfolio/       # Portfolio items (markdown)
│   └── tutorials/       # Tutorial articles (markdown)
├── layouts/             # Astro layouts
│   ├── BaseLayout.astro # HTML shell with SEO and meta tags
│   ├── PageLayout.astro # Standard page wrapper
│   └── TutorialLayout.astro # Tutorial-specific layout
├── pages/               # Route pages
│   ├── portfolio/       # Portfolio listing and detail pages
│   ├── tutorials/       # Tutorial listing and detail pages
│   ├── about.astro      # About page
│   ├── contact.astro    # Contact page
│   ├── index.astro      # Homepage
│   └── 404.astro        # Error page
├── styles/              # Global styles and design tokens
│   └── global.css       # Tailwind CSS and custom styles
├── lib/                 # Utility functions and helpers
└── types/               # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager


### Environment Variables


---

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:4321`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run astro` - Run Astro CLI commands

## 🎯 Key Components

### Layout Components

- **Header**: Fixed navigation with transparent-to-white scroll behavior
- **Navigation**: Responsive navigation with mobile menu overlay
- **Footer**: Three-column layout with brand, links, and contact info

### Section Components

- **Hero**: Full-viewport section with animated text and 3D jewelry showcase
- **Portfolio**: Filterable grid with asymmetric layout and animations
- **Services**: Three-column service cards with icons and CTAs
- **Tutorials**: Horizontal scroll section with category badges

### Common Components

- **Button**: Design system button with multiple variants and sizes
- **AnimatedText**: React component for headline text animations

## 🎨 Design System

### Colors

- **Primary**: Sophisticated grays for main interface elements
- **Secondary**: Warm earth tones for accents and highlights
- **Accent**: Luxury gold tones for premium features
- **Neutral**: Full grayscale palette for text and backgrounds

### Typography

- **Display Font**: Playfair Display (elegant serif for headings)
- **Body Font**: Inter (clean sans-serif for readability)
- **Accent Font**: Crimson Text (serif for special content)

## 📱 Responsive Design

The website uses a mobile-first approach with breakpoints at:

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: 1440px+

## ♿ Accessibility

The website meets WCAG 2.1 AA standards with semantic HTML, ARIA labels, keyboard navigation, and high contrast ratios.

## 📈 Performance

Optimized for excellent Core Web Vitals with static generation, partial hydration, and efficient asset delivery.

## 🛠️ Development

Built with TypeScript, ESLint, and Prettier for maintainable, high-quality code following Astro and React best practices.

## 🚀 Deployment

This project is deployed on **Cloudflare Pages** at https://phialo.de

See [`DEPLOY.md`](./DEPLOY.md) for deployment instructions.

### Key Files

- `wrangler.toml` - Cloudflare deployment configuration
- `public/_headers` - Security headers and caching rules
- `public/_redirects` - URL redirects and rewrites
- `.env` - Environment variables (never commit this file)

---

Built with ❤️ and attention to detail, just like our jewelry.
