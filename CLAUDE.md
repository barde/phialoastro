# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Phialo Design**, a luxury jewelry portfolio website built with Astro 5.9.3 using Islands Architecture. The site features German/English multilingual support and is deployed on Cloudflare Workers at `phialo.de`.

## ⚠️ Critical Anti-Patterns - MUST AVOID

### Alpine.js Best Practices
ALWAYS define Alpine functions globally:
```javascript
// ✅ CORRECT - Make functions available globally
<script is:inline>
  window.myComponent = function(data) {
    return {
      // Alpine component logic
    };
  }
</script>
```

Proper Alpine.js initialization:
```html
<!-- ✅ CORRECT - Use window prefix for global functions -->
<div x-data="window.myComponent(data)">
  <!-- Component HTML -->
</div>
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

## Package Manager Requirements

**IMPORTANT: This project uses pnpm v9.14.4 exclusively. DO NOT use npm, yarn, or any other package manager.**

### Setup
```bash
# Install pnpm if not already installed
npm install -g pnpm@9.14.4

# Install dependencies (always use pnpm)
cd phialo-design && pnpm install
cd ../workers && pnpm install
```

## Common Development Commands

```bash
# Main Application (phialo-design/)
pnpm run dev                 # Start dev server on localhost:4321
pnpm run build              # Build for production
pnpm run preview            # Preview production build locally

# Workers (workers/)
pnpm run dev                # Start worker dev server
pnpm run deploy:preview     # Deploy to preview environment
pnpm run deploy:production  # Deploy to production

# Testing (phialo-design/)
pnpm run test               # Run tests in watch mode
pnpm run test:run           # Run tests once
pnpm run test:ui            # Run tests with UI

# Code Quality (phialo-design/) - MUST RUN BEFORE PR
pnpm run lint               # Run linter
pnpm run typecheck         # Run TypeScript checks
pnpm run format:check      # Check code formatting
pnpm run pre-push          # Run all pre-push checks

# Maintenance
./scripts/clean-project.sh # Remove .DS_Store and other junk files
```

## Image Management

This repository stores images directly in Git (no LFS required). Images are optimized for web delivery:

### Image Storage
- **Portfolio images**: ~21MB total in `public/images/portfolio/`
- **Other assets**: Various UI and content images
- **No LFS needed**: All images are small enough for regular Git storage

### Image Optimization
- **Build-time generation**: WebP and AVIF formats are generated during build
- **Not stored in Git**: Only source JPG/PNG files are version controlled
- **Automatic optimization**: `pnpm run build` runs the image generation script

### Important Notes
- **Direct storage**: Images are stored directly in Git (no LFS)
- **Size limits**: Keep individual images under 10MB for best performance
- **Generated formats**: WebP/AVIF files are created at build time, not committed

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

## Development Environment

- **Package Manager**: Use pnpm v9.14.4 exclusively (configured in packageManager field)
- If dev server is not on http://localhost:4321/, run the website on http://localhost:4322/ for dev purposes. If the site is not reachable then kill it
- **Docker is OPTIONAL**: Local development does not require Docker. Use standard pnpm commands for development.
- For CI/CD testing or containerized development, see [Local CI Setup](./phialo-design/docs/how-to/local-ci-setup.md)

## Architecture Overview

### Core Stack
- **Astro 5.9.3**: Static site generator with Islands Architecture
- **Alpine.js 3.14.4**: Lightweight framework for interactive components (15KB vs React's 200KB)
- **Tailwind CSS 3.4.1**: Comprehensive design system with luxury brand tokens
- **TypeScript**: Strict configuration with Astro defaults
- **Vitest**: Testing framework for unit and integration tests

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
- ALWAYS filter content by language when querying collections

## Multilingual System

The site uses a custom URL-based multilingual system for German/English support:
- LanguageSelector component handles language switching with localStorage persistence
- German is the default language (served at root `/`)
- English content is served under `/en/` prefix
- Language preference persists across page navigation

### Important Notes on Alpine.js Components
- Portfolio and other Alpine components use URL-based language detection
- Alpine.js provides reactive data without hydration issues
- Use `x-data` for component state and `x-show`/`x-if` for conditional rendering
- Alpine automatically handles reactivity without manual state management

## Alpine.js Testing Checklist

Before submitting ANY Alpine component PR:

1. [ ] Test with JavaScript disabled - component should render meaningful content
2. [ ] Check browser console for Alpine initialization errors
3. [ ] Verify language switching works without page reload
4. [ ] Test rapid navigation between pages
5. [ ] Verify localStorage persistence works correctly
6. [ ] Check that Alpine components initialize properly
7. [ ] Run `pnpm run build && pnpm run preview` and test in production mode

Test command sequence:
```bash
pnpm run build
pnpm run preview
# Open in browser with DevTools
# Check Console for hydration errors
# Test with Network throttling
```

## Common Solutions Cookbook

### Language-Aware Navigation
```tsx
// Always use this pattern for language-aware links
import { getLangFromUrl } from '@/utils/i18n';

const Navigation = ({ currentPath }: { currentPath: string }) => {
  const lang = getLangFromUrl(currentPath);
  const prefix = lang === 'en' ? '/en' : '';
  
  return (
    <nav>
      <a href={`${prefix}/portfolio`}>Portfolio</a>
      <a href={`${prefix}/services`}>Services</a>
    </nav>
  );
};
```

### Content Collection with Language Support
```typescript
// Always filter by language in content collections
const portfolioItems = await getCollection('portfolio', ({ data }) => {
  return data.language === lang;
});
```

### Performance-Optimized Images
```astro
---
import { Image } from 'astro:assets';
import myImage from '../assets/image.jpg';
---
<!-- Always use Astro's Image component -->
<Image 
  src={myImage} 
  alt="Description"
  widths={[400, 800, 1200]}
  sizes="(max-width: 800px) 100vw, 800px"
  loading="lazy"
/>
```

## Repository Hygiene Rules

### Pre-commit Checklist
1. Run cleanup script: `./scripts/clean-project.sh`
2. Check repository size: `du -sh .git`
3. Verify no large files: `git ls-files -z | xargs -0 du -h | sort -hr | head -20`
4. Ensure .gitignore is complete
5. Run linting: `pnpm run lint`
6. Run type checking: `pnpm run typecheck`

### If you accidentally commit large files:
```bash
# Remove from history (ONLY if not pushed)
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/large/file' --prune-empty --tag-name-filter cat -- --all
```

### Maximum file sizes:
- Images: 2MB (use Astro's image optimization)
- Videos: Upload to external service
- Documents: 5MB
- Any other file: 1MB

## Project Constants

### Business Information
- Company: Phialo Design
- Domain: phialo.de
- Primary Language: German (de)
- Secondary Language: English (en)
- Contact Email: info@phialo.de
- Phone: +49 (0) 123 456789 [TO BE CONFIRMED]

### Technical Constants
- Development Port: 4321
- Preview Port: 4322
- Max Bundle Size: 350KB
- Target Lighthouse Score: 90+
- Supported Browsers: Chrome 90+, Firefox 90+, Safari 14+

## Design System

Tailwind configuration includes:
- **Color Palette**: Luxury brand colors (primary, secondary, accent, neutral)
- **Typography**: Playfair Display (headings), Inter (body), custom font scale
- **Animations**: Custom keyframes for luxury aesthetics
- **Glass Effects**: Custom utilities for frosted glass UI elements

## Testing Requirements

### Before ANY PR
1. Run full test suite: `pnpm run test:run`
2. Test multilingual features manually
3. Check for console errors in browser
4. Verify mobile responsiveness
5. Test with slow network (Chrome DevTools)
6. Run lint and typecheck: `pnpm run lint && pnpm run typecheck`

### Multilingual Testing Script
```typescript
// Add to test files for language-dependent components
describe('Multilingual Component', () => {
  it('renders German content by default', () => {
    // Test German version
  });
  
  it('renders English content with /en/ prefix', () => {
    // Mock window.location
    // Test English version
  });
  
  it('handles hydration without errors', () => {
    // Test no console errors
    // Test content matches
  });
});
```

## Performance Guidelines

### Bundle Size Limits
- Initial JS: < 100KB
- Total JS: < 350KB
- CSS: < 50KB
- Largest image: < 200KB

### Monitoring Commands
```bash
# Check bundle size
pnpm run build && pnpm run analyze

# Test performance
pnpm run lighthouse

# Find large dependencies
pnpm list --depth=0 | grep -E "^├|^└" | sort -k2 -hr
```

### Optimization Checklist
- [ ] Use dynamic imports for heavy components
- [ ] Implement proper image lazy loading
- [ ] Remove unused dependencies
- [ ] Enable Astro's compression
- [ ] Use CSS modules for component styles

## Analytics Configuration

### Cloudflare Web Analytics

The site uses Cloudflare Web Analytics for privacy-compliant visitor tracking:

- **Environment Variable**: `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`
- **Token Location**: Cloudflare Dashboard → Analytics & Logs → Web Analytics
- **Implementation**: Automatically disabled in development when token is not set
- **Privacy**: No cookies, no personal data collection, GDPR compliant

**Setup Instructions**:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Analytics & Logs → Web Analytics
3. Add your site (phialo.de) if not already added
4. Copy the Site Token from the provided snippet
5. Add to `.env` file: `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=your_token`

**Environment-Specific Behavior**:
- Development: Analytics disabled when token is not set
- Production: Analytics enabled with production token
- Preview/PR: Can use separate tokens for testing

## Security Features

### Cloudflare Turnstile Pre-clearance

The site implements Cloudflare Turnstile with pre-clearance for enhanced security and user experience:

- **Centralized Token Management**: TurnstileProvider manages all script loading and tokens
- **Pre-clearance Support**: Users complete CAPTCHA once for multiple form submissions
- **Graceful Degradation**: Falls back to widget mode if pre-clearance fails
- **Single-Use Tokens**: Tokens are removed from cache after use
- **No Race Conditions**: Fixed script loading issue from PR #235

**IMPORTANT: Environment-Specific Behavior**:

| Environment | Basic CAPTCHA | Pre-clearance | Console Warning |
|-------------|---------------|---------------|-----------------|
| `localhost` | ✅ Works | ✅ Works* | None |
| `*.workers.dev` | ✅ Works | ❌ Not supported | Yes (expected) |
| `phialo.de` | ✅ Works | ✅ Full support | None |

*With test keys only

**Expected Console Warning on workers.dev**:
```
[Cloudflare Turnstile] Cannot determine Turnstile's embedded location, 
aborting clearance redemption, are you running Turnstile on a Cloudflare Zone?
```
This is normal behavior and doesn't affect basic protection functionality.

**Testing Guidelines**:
- Basic functionality: Test on any environment
- Pre-clearance features: Test ONLY on production (`phialo.de`)
- Form protection works everywhere, only multi-form token reuse requires production

Implementation files:
- `src/shared/contexts/TurnstileProvider.tsx` - Token management and script loading
- `src/features/contact/components/ContactFormWithPreClearance.tsx` - Pre-clearance form
- `src/shared/types/turnstile.d.ts` - TypeScript definitions
- See [Turnstile Setup Guide](./phialo-design/docs/how-to/setup-turnstile-preclearance.md) for details

## Deployment

### Deployment Environments

#### Production (`phialo-design`)
- **URL**: https://phialo.de (custom domain)
- **Deployment**: Manual via GitHub UI or CLI
- **Branch**: Tagged releases only
- **Note**: Requires zone permissions for custom domain

#### Master (`phialo-master`) 
- **URL**: https://phialo-master.meise.workers.dev
- **Deployment**: Automatic on push to master branch
- **Purpose**: Latest master branch deployment
- **Manual Deploy**: Available via GitHub Actions UI

#### Ephemeral PR Previews (`phialo-pr-{number}`)
- **URL**: https://phialo-pr-{number}.meise.workers.dev
- **Deployment**: Automatic on PR creation/update
- **Cleanup**: Automatic on PR close/merge
- **Purpose**: Isolated testing for each PR

### Cloudflare API Requirements

For workers.dev deployments (preview & PR environments):
- Account: Workers Scripts:Edit, Workers KV Storage:Edit

For custom domain deployment (production only):
- Account: Workers Scripts:Edit, Workers KV Storage:Edit
- Zone (phialo.de): Workers Routes:Edit, Zone:Read

### Technical Details
- Security headers configured in Workers script
- CSP allows YouTube embeds
- Workers handle static asset serving and dynamic routing
- Also possible to deploy via instructions from [DEPLOY.md](./phialo-design/docs/how-to/DEPLOY.md) to get more debug data via web browsing

### Manual Deployment Options

Multiple methods available for triggering deployments without pushing code:

1. **GitHub Actions UI**: Use workflow_dispatch from Actions tab
2. **PR Comments**: Use `/deploy` or `/deploy-production` commands
3. **Webhook API**: POST to repository_dispatch endpoint
4. **GitHub CLI**: `gh workflow run manual-deploy.yml`
5. **Shell Script**: `./scripts/deploy.sh -e preview`

See [Manual Deployments Guide](./phialo-design/docs/how-to/manual-deployments.md) for detailed instructions.

### Wrangler Worker Management

#### Listing Workers
Unfortunately, wrangler doesn't provide a direct command to list all workers in an account. To manage workers:

```bash
# Check if a specific worker exists
npx wrangler deployments list --name "worker-name"

# Delete a specific worker
npx wrangler delete --name "worker-name" --force

# Check worker deployments (requires worker name)
npx wrangler deployments list --name "phialo-design-preview"

# View worker logs
npx wrangler tail "worker-name"
```

#### Alternative: Use Cloudflare API
```bash
# List all workers (requires env vars)
curl -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" | jq -r '.result[].id'
```

#### Cleaning Up Ephemeral Workers
To manually clean up dangling PR preview workers:
```bash
# Check specific PR workers
for pr in 100 101 102 103; do
  echo "Checking phialo-pr-$pr..."
  npx wrangler delete --name "phialo-pr-$pr" --force 2>/dev/null || echo "Not found"
done
```

Note: The cleanup-preview.yml workflow now automatically handles worker cleanup when PRs are closed.

## Key Files to Understand

- `astro.config.mjs`: Core Astro configuration with Alpine.js/Tailwind integration
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

## AI Assistant Instructions

When working on this codebase:

1. **ALWAYS check existing patterns first** - Use grep/search before implementing
2. **NEVER assume libraries exist** - Check package.json first
3. **ALWAYS handle hydration** - Use useState/useEffect pattern for client-side data
4. **NEVER hardcode content** - Use content collections or props
5. **ALWAYS test language switching** - Both German and English must work
6. **NEVER commit without cleanup** - Run `./scripts/clean-project.sh`
7. **ALWAYS use parallel searches** - Search multiple patterns simultaneously
8. **NEVER create files unnecessarily** - Prefer editing existing files
9. **ALWAYS run lint and typecheck** - Before marking any task as complete

### Common Search Patterns
```bash
# Find similar components
rg "export default.*Component" --type tsx
# Find language usage
rg "getLangFromUrl|useLanguage" --type ts
# Find hydration patterns
rg "useState.*useEffect" --type tsx -A 5 -B 5
```

## GitHub Workflow

- Always solve issues from GitHub in branches and make PRs
- Work with feature branches preferably linking them to GitHub issues using the `gh` command
- Leave clean git status results after work by pushing open files in their respective branches
- You should always start by syncing with the online repo and creating a branch. if you finish your work, you clean up all staged files either by removing, adding them to .gitignore or to your commit
- Create PRs with comprehensive descriptions of changes
- Reference the issue number in PR titles (e.g., "Fix hydration issue in Portfolio component #22")

## Browser Automation

- Use playwright and **NEVER** use puppeteer or other browser automation tools

## Script Development Best Practices

- Always use a linter when editing deployment scripts, e.g. yml files for github workflows

## Project Maintenance & Cleanliness

- **No junk files**: The project must be kept clean of system files (.DS_Store, Thumbs.db, etc.)
- **No empty directories**: Remove any empty folders that serve no purpose
- **Use cleanup script**: Run `./scripts/clean-project.sh` regularly to maintain cleanliness
- **Gitignore enforcement**: All system/temporary files must be in .gitignore
- **Clean structure**: Follow the documented directory structure strictly

## Emergency Procedures

### If the site is broken in production:
1. Revert to last known good commit
2. Deploy from Cloudflare Workers dashboard
3. Check Workers script for CSP/header issues
4. Verify environment variables and KV namespaces

### If Alpine.js errors appear:
1. Ensure Alpine scripts have `is:inline` attribute
2. Verify functions are attached to `window` object
3. Check for proper x-data initialization
4. Verify Alpine.js is loaded before components

### If build fails:
1. Clear cache: `rm -rf .astro node_modules pnpm-lock.yaml`
2. Reinstall: `pnpm install`
3. Check Node version: `node --version` (should be 18+)
4. Verify all imports resolve correctly
