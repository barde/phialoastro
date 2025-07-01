# Dependabot Auto-Triage Configuration

This repository has been configured with Dependabot auto-triage rules to streamline dependency management.

## Features

### 1. Automatic Labeling
- **Security updates**: Labeled with `security` and `priority:high`
- **Patch updates**: Labeled with `semver:patch` and `priority:low`
- **Minor updates**: Labeled with `semver:minor` and `priority:medium`
- **Major updates**: Labeled with `semver:major`, `priority:high`, and `breaking-change`

### 2. Auto-Merge Rules
The following updates are automatically merged if all CI checks pass:
- ✅ **Patch updates** for development dependencies
- ✅ **Minor updates** for specific dev dependencies:
  - eslint
  - prettier
  - vitest
  - @testing-library
  - playwright

### 3. Auto-Approval
The following updates are automatically approved:
- ✅ All patch updates
- ✅ Minor updates for development dependencies

### 4. Manual Review Required
The following updates require manual review:
- ❌ **Major version updates** (all packages)
- ❌ **Production dependency updates** (all versions)
- ❌ **Security updates** (expedited review requested)

## Commit Message Format
- Root dependencies: `chore: update [package]` or `chore(dev): update [package]`
- Phialo-design dependencies: `chore: update [package]` or `chore(dev): update [package]`
- Worker dependencies: `chore(workers): update [package]` or `chore(workers-dev): update [package]`
- GitHub Actions: `chore(ci): update [action]`

## Workflow Files
1. **dependabot-auto-merge.yml**: Handles automatic merging of approved updates
2. **dependabot-auto-triage.yml**: Handles labeling and commenting on PRs

## Configuration
The main configuration is in `.github/dependabot.yml` with the following settings:
- Weekly update schedule (Mondays at 5:00 AM)
- Grouped updates for development and production dependencies
- Ignored major updates for critical packages (astro, react, tailwindcss)

## Security Notes
- Production dependency updates always require manual review
- Security updates are flagged with high priority but still require review
- Major version updates include a checklist comment for breaking changes

## Monitoring
To monitor Dependabot activity:
1. Check the [Dependabot alerts](../../security/dependabot) page
2. Review [open Dependabot PRs](../../pulls?q=is%3Apr+author%3Aapp%2Fdependabot)
3. Check the [Actions tab](../../actions) for auto-merge workflow runs