# GitHub Actions Workflows

This directory contains automated workflows for the Phialo Design CI/CD pipeline.

## Workflows Overview

### 🔨 `docker-images.yml` - Main CI/CD Pipeline
- **Purpose**: Build, test, and publish Docker images
- **Triggers**: Push to main, PRs, weekly schedule, manual
- **Images**: Base, Test, Build/Deploy
- **Features**: Multi-arch builds, security scanning, auto-tagging

### 🔍 `docker-pr-builds.yml` - PR-Specific Builds
- **Purpose**: Build unique images for each PR
- **Triggers**: PR opened/updated
- **Features**: PR comments with image info, auto-cleanup on close

### 🛡️ `docker-security-updates.yml` - Security Scanning
- **Purpose**: Daily vulnerability scanning and auto-rebuild
- **Triggers**: Daily 3 AM UTC, manual
- **Features**: Trivy scanning, issue creation, configurable thresholds

### 🧹 `docker-cleanup.yml` - Registry Maintenance
- **Purpose**: Clean up old images and free space
- **Triggers**: Weekly Sunday 4 AM UTC, manual
- **Features**: Retention policies, dry run mode, detailed reports

### 🎭 `e2e-sharded.yml` - Parallel E2E Testing [DISABLED]
- **Status**: Disabled to reduce CI costs - E2E tests now run only in nightly workflow
- **Purpose**: Previously ran E2E tests in parallel shards on PRs
- **Note**: To re-enable, rename `e2e-sharded.yml.disabled` back to `e2e-sharded.yml`

### 🌙 `nightly-tests.yml` - Comprehensive Nightly Tests
- **Purpose**: Run full test suite including all Playwright E2E tests with visual/screenshot testing
- **Triggers**: Daily 2 AM UTC on master branch, manual with suite selection
- **Test Types**: Unit, Integration, E2E (including visual tests), Performance, Security
- **Matrix**: Node.js 18/20/22, Ubuntu/Alpine, all browsers
- **Features**: Issue creation on failure, 90-day report retention, parallel E2E sharding

## Required Secrets

Configure these in Settings → Secrets and variables → Actions:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub | All workflows |
| `CLOUDFLARE_API_TOKEN` | Cloudflare deployment | Deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | Deployment |
| `WEB3FORMS_ACCESS_KEY` | Contact form | Runtime only |

## Permissions

Ensure workflows have proper permissions in Settings → Actions → General:
- **Read and write permissions**
- **Allow GitHub Actions to create and approve pull requests**

## Manual Triggers

### Rebuild All Images
```bash
gh workflow run docker-images.yml -f force_rebuild=true
```

### Security Scan Only
```bash
gh workflow run docker-security-updates.yml -f severity_threshold=MEDIUM
```

### Cleanup Preview
```bash
gh workflow run docker-cleanup.yml -f dry_run=true -f keep_days=7
```

### Run E2E Tests
```bash
# E2E tests are now part of nightly workflow only
# To run E2E tests manually:
gh workflow run nightly-tests.yml -f test_suites="e2e" -f browsers="chromium,firefox,webkit"

# Run specific browser only
gh workflow run nightly-tests.yml -f test_suites="e2e" -f browsers="chromium"
```

### Run Nightly Tests
```bash
# Full nightly test suite
gh workflow run nightly-tests.yml

# Select specific test suites
gh workflow run nightly-tests.yml -f test_suites="unit,e2e"

# Test specific Node.js versions
gh workflow run nightly-tests.yml -f node_versions="20,22"

# Skip security scanning
gh workflow run nightly-tests.yml -f skip_security=true
```

## Workflow Status Badges

Add these to your README:

```markdown
![Docker CI/CD](https://github.com/[owner]/phialoastro/actions/workflows/docker-images.yml/badge.svg)
![Security Scan](https://github.com/[owner]/phialoastro/actions/workflows/docker-security-updates.yml/badge.svg)
![E2E Tests](https://github.com/[owner]/phialoastro/actions/workflows/e2e-sharded.yml/badge.svg)
![Nightly Tests](https://github.com/[owner]/phialoastro/actions/workflows/nightly-tests.yml/badge.svg)
```

## Monitoring

1. **Actions Tab**: View all workflow runs
2. **Security Tab**: Check vulnerability scan results
3. **Packages**: Monitor registry usage
4. **Issues**: Track security alerts

## Troubleshooting

### Workflow Not Running
- Check workflow triggers match your changes
- Verify workflow files are valid YAML
- Check repository Actions settings

### Permission Denied
- Ensure `packages: write` permission
- Check PAT has correct scopes
- Verify workflow permissions

### Build Failures
- Check logs for specific errors
- Verify base images are available
- Check for rate limiting

## Best Practices

1. **Test locally first**: Use `ci/scripts/test-ci-pipeline.sh`
2. **Use PR builds**: Test changes in PR before merging
3. **Monitor costs**: Track Actions minutes usage
4. **Regular cleanup**: Run cleanup workflow monthly
5. **Security first**: Address vulnerabilities promptly

## Contributing

When modifying workflows:
1. Test syntax with `yamllint`
2. Use `act` for local testing (optional)
3. Create PR with clear description
4. Wait for PR build to complete
5. Check all status checks pass