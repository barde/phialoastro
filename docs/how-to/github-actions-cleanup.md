# GitHub Actions Cleanup Guide

This guide explains the automated cleanup strategies implemented in our GitHub Actions workflows to optimize storage, performance, and costs.

## Overview

We use several cleanup strategies:
1. **Scheduled artifact cleanup** - Removes old artifacts, caches, and workflow runs
2. **PR preview cleanup** - Deletes ephemeral Cloudflare Workers when PRs close
3. **Runner disk optimization** - Frees space on GitHub-hosted runners during builds
4. **Reduced retention periods** - Artifacts kept for shorter durations

## Cleanup Workflows

### 1. Artifact & Cache Cleanup (`cleanup-artifacts.yml`)

**Purpose:** Automatically clean up old artifacts, caches from deleted branches, and old workflow runs.

**Schedule:** Runs daily at 3 AM UTC

**Features:**
- Deletes artifacts older than 7 days (configurable)
- Removes caches from deleted branches
- Cleans up old workflow runs (30+ days)
- Supports dry-run mode for safety
- Provides detailed summaries

**Manual Trigger:**
```bash
gh workflow run cleanup-artifacts.yml \
  -f days_to_keep=7 \
  -f dry_run=true
```

### 2. PR Preview Cleanup (`cleanup-preview.yml`)

**Purpose:** Automatically delete Cloudflare Workers created for PR previews.

**Trigger:** When a PR is closed or merged

**Features:**
- Deletes worker named `phialo-pr-{number}`
- Comments on PR when cleanup is complete
- Handles missing workers gracefully

### 3. Runner Disk Space Optimization (`runner-cleanup.yml`)

**Purpose:** Free up disk space on GitHub-hosted runners for large builds.

**Usage:** Call from other workflows when extra space is needed:

```yaml
jobs:
  cleanup:
    uses: ./.github/workflows/runner-cleanup.yml
    with:
      aggressive: true
      target-free-gb: 30
```

**Features:**
- Basic cleanup (caches, temp files)
- Aggressive mode (removes unused tools)
- Docker cleanup
- Utilizes `/mnt` for extra space
- Provides space reports

## Best Practices

### 1. Artifact Retention

Set appropriate retention periods:
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: results/
    retention-days: 3  # Reduced from default 90
```

### 2. Cache Management

Use cache keys with versions:
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### 3. Workflow Optimization

For large builds, add cleanup step:
```yaml
steps:
  - name: Free disk space
    uses: ./.github/workflows/runner-cleanup.yml
    with:
      aggressive: true
      
  - name: Build project
    run: npm run build
```

## Storage Limits

GitHub Actions provides:
- **Artifacts:** 500MB per artifact, 50GB total
- **Caches:** 10GB per repository
- **Logs:** 90 days retention

## Monitoring

Check cleanup results:
1. Go to Actions tab
2. Find "Cleanup Artifacts & Cache" workflow
3. View run summaries for detailed reports

## Cost Optimization

These cleanup strategies help reduce:
- Storage costs for artifacts
- Build time by maintaining efficient caches
- API rate limits by removing old workflow runs

## Troubleshooting

### Cleanup workflow fails
- Check permissions in repository settings
- Ensure `GITHUB_TOKEN` has required permissions
- Try dry-run mode first

### Not enough space freed
- Enable aggressive mode in runner cleanup
- Reduce artifact retention further
- Consider self-hosted runners for large builds

### PR preview not deleted
- Check Cloudflare API token permissions
- Verify worker naming convention
- Check cleanup workflow logs

## Manual Cleanup Commands

If needed, run these locally:

```bash
# List all artifacts
gh api repos/:owner/:repo/actions/artifacts

# Delete specific artifact
gh api -X DELETE repos/:owner/:repo/actions/artifacts/{artifact_id}

# List all caches
gh api repos/:owner/:repo/actions/caches

# Delete specific cache
gh api -X DELETE repos/:owner/:repo/actions/caches/{cache_id}
```