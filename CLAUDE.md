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

## Git LFS Requirements

This repository uses Git Large File Storage (LFS) for managing binary files (images, etc.). **Git LFS is REQUIRED** for development and CI/CD.

### Setup Instructions
```bash
# Install Git LFS (if not already installed)
brew install git-lfs  # macOS
# or
sudo apt-get install git-lfs  # Ubuntu/Debian

# Initialize Git LFS in your local repository
git lfs install

# Pull all LFS files
git lfs pull
```

### LFS Configuration
The repository tracks these file types with LFS (defined in `.gitattributes`):
- `*.jpg` - JPEG images
- `*.png` - PNG images  
- `*.webp` - WebP images

### Important Notes
- **CI/CD requires LFS**: GitHub Actions workflows use `lfs: true` in checkout steps
- **Check LFS status**: Run `git lfs status` before pushing to ensure files are properly tracked
- **Storage quotas**: Be aware of GitHub LFS bandwidth and storage limits
- **Team coordination**: All team members must have Git LFS installed

### Troubleshooting
If you encounter LFS-related errors:
1. Ensure Git LFS is installed: `git lfs version`
2. Pull LFS files: `git lfs pull`
3. Check tracked files: `git lfs ls-files`
4. Verify file status: `git lfs status`

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

- If dev server is not on http://localhost:4321/, run the website on http://localhost:4322/ for dev purposes. If the site is not reachable then kill it
- **Docker is OPTIONAL**: Local development does not require Docker. Use standard npm commands for development.
- For CI/CD testing or containerized development, see [Local CI Setup](./phialo-design/docs/how-to/local-ci-setup.md)

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
- ALWAYS filter content by language when querying collections

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

## Hydration Testing Checklist

Before submitting ANY React component PR:

1. [ ] Test with JavaScript disabled - component should render meaningful content
2. [ ] Check browser console for hydration warnings
3. [ ] Verify language switching works without page reload
4. [ ] Test rapid navigation between pages
5. [ ] Verify localStorage persistence works correctly
6. [ ] Check that initial render matches server render
7. [ ] Run `npm run build && npm run preview` and test in production mode

Test command sequence:
```bash
npm run build
npm run preview
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
5. Run linting: `npm run lint`
6. Run type checking: `npm run typecheck`

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
1. Run full test suite: `npm run test:run`
2. Test multilingual features manually
3. Check for console errors in browser
4. Verify mobile responsiveness
5. Test with slow network (Chrome DevTools)
6. Run lint and typecheck: `npm run lint && npm run typecheck`

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
npm run build && npm run analyze

# Test performance
npm run lighthouse

# Find large dependencies
npm list --depth=0 | grep -E "^├|^└" | sort -k2 -hr
```

### Optimization Checklist
- [ ] Use dynamic imports for heavy components
- [ ] Implement proper image lazy loading
- [ ] Remove unused dependencies
- [ ] Enable Astro's compression
- [ ] Use CSS modules for component styles

## Security Features

### Cloudflare Turnstile Pre-clearance

The site implements Cloudflare Turnstile with pre-clearance for enhanced security and user experience:

- **Global Script Loading**: Turnstile script loads once in BaseLayout for performance
- **Centralized Token Management**: TurnstileProvider manages tokens across the app
- **Pre-clearance Support**: Users complete CAPTCHA once for multiple form submissions
- **Graceful Degradation**: Falls back to widget mode if pre-clearance fails

Implementation files:
- `src/shared/contexts/TurnstileProvider.tsx` - Token management
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

### If hydration errors appear:
1. Add client:only="react" to affected components
2. Implement proper useState/useEffect pattern
3. Check for window/document usage
4. Verify language detection logic

### If build fails:
1. Clear cache: `rm -rf .astro node_modules package-lock.json`
2. Reinstall: `npm install`
3. Check Node version: `node --version` (should be 18+)
4. Verify all imports resolve correctly
