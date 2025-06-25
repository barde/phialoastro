# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Phialo Design**, a luxury jewelry portfolio website built with Astro 5.9.3 using Islands Architecture. The site features German/English multilingual support and is deployed on Cloudflare Workers at `phialo.de`.

## ⚠️ Critical Anti-Patterns - MUST AVOID

### React Hydration Mistakes
NEVER do this:
```tsx
// ❌ WRONG - Causes hydration mismatch
const Component = () => {
  const isGerman = window.location.pathname.startsWith('/en/') ? false : true;
  return <div>{isGerman ? 'Deutsch' : 'English'}</div>;
};
```

ALWAYS do this:
```tsx
// ✅ CORRECT - Handles SSR properly
const Component = () => {
  const [isGerman, setIsGerman] = useState(true); // Default state
  
  useEffect(() => {
    setIsGerman(!window.location.pathname.startsWith('/en/'));
  }, []);
  
  return <div>{isGerman ? 'Deutsch' : 'English'}</div>;
};
```

### File Management Mistakes
NEVER commit:
- Files larger than 10MB
- node_modules directory
- .DS_Store files
- Build outputs (dist/, .astro/)
- Log files or archives
- workflow.log.zip or similar large files

ALWAYS check file size before committing:
```bash
find . -size +10M -not -path "./node_modules/*"
```

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

# Code Quality (MUST RUN BEFORE PR)
npm run lint               # Run linter
npm run typecheck         # Run TypeScript checks
npm run format:check      # Check code formatting
npm run pre-push          # Run all pre-push checks

# Deployment
npm run deploy             # Deploy to Cloudflare Workers production
npm run deploy:preview     # Deploy to Cloudflare Workers preview

# Maintenance
./scripts/clean-project.sh # Remove .DS_Store and other junk files
```

## PR and Development Guidelines

- Always wait for PR post-push checks like e2e tests
- Your PR is finished when either all tests pass or when you see an issue not related to the PR itself
- Always do smaller fixes as part of the PR

## Component Decision Matrix

| Use Case | Use .astro | Use .tsx | Example |
|----------|------------|----------|---------|
| Static content | ✅ | ❌ | About page, Legal pages |
| SEO-critical content | ✅ | ❌ | Landing pages, Product pages |
| Interactive forms | ❌ | ✅ | Contact form, Newsletter signup |
| Dynamic filtering | ❌ | ✅ | Portfolio gallery with filters |
| Navigation with state | ❌ | ✅ | Language selector with persistence |
| Pure display components | ✅ | ❌ | Cards, Headers, Footers |
| Client-side only logic | ❌ | ✅ | Shopping cart, User preferences |

[Rest of the file remains unchanged]