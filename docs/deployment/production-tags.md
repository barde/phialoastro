# Production Deployment Tags

## Overview

The phialoastro project automatically creates git tags for every production deployment. This provides a complete audit trail of what code was deployed to production and when.

## Tag Format

Production tags use a timestamp-based naming convention:
```
production-YYYY-MM-DD-HHMMSS
```

Example: `production-2025-01-23-143025`

This format ensures:
- **Uniqueness**: Timestamps with second precision prevent conflicts
- **Chronological ordering**: Tags sort naturally by date/time
- **Human readability**: Easy to understand when a deployment occurred
- **No version management**: No need to track or increment version numbers

## Tag Metadata

Each tag is an annotated git tag containing deployment metadata:
- Deployed by (GitHub user)
- Source branch
- Commit SHA
- GitHub Actions workflow run link
- Production URL
- Timestamp

## Using Tags

### List Recent Production Tags
```bash
# List the 10 most recent production tags
git tag -l "production-*" --sort=-version:refname | head -10

# Show details of a specific tag
git show production-2025-01-23-143025
```

### Deploy a Previous Version (Rollback)
```bash
# Using GitHub CLI
gh workflow run manual-deploy.yml \
  -f environment=production \
  -f branch=production-2025-01-23-143025 \
  -f skip_tests=false

# Or via GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Manual Cloudflare Deployment"
# 3. Click "Run workflow"
# 4. Enter the tag name in the "Branch" field
```

### Compare Deployments
```bash
# See what changed between two deployments
git diff production-2025-01-22-100000..production-2025-01-23-143025

# See commit log between deployments
git log production-2025-01-22-100000..production-2025-01-23-143025 --oneline
```

### Generate Changelog
```bash
# Generate a changelog since the last deployment
LAST_TAG=$(git tag -l "production-*" --sort=-version:refname | head -1)
PREV_TAG=$(git tag -l "production-*" --sort=-version:refname | head -2 | tail -1)

echo "Changes from $PREV_TAG to $LAST_TAG:"
git log $PREV_TAG..$LAST_TAG --pretty=format:"- %s (%an)" --no-merges
```

## Implementation Details

### Workflow Configuration

The tagging is implemented in `.github/workflows/manual-deploy.yml`:
- Tags are created only for production deployments
- Tag creation happens after successful deployment
- If tag creation fails, the deployment still succeeds (non-blocking)
- The workflow requires `contents: write` permission

### Error Handling

- Tag creation uses `continue-on-error: true` to prevent blocking deployments
- Failed tag creations are logged but don't fail the workflow
- The deployment summary shows tag creation status

### Security

- Tags are created using the `GITHUB_TOKEN` 
- The token is automatically provided by GitHub Actions
- No additional secrets or permissions are required beyond `contents: write`

## Troubleshooting

### Tag Not Created

If a tag wasn't created for a production deployment:
1. Check the workflow logs for the "Create production release tag" step
2. Verify the workflow has `contents: write` permission
3. Ensure the deployment was to the production environment

### Manual Tag Creation

If you need to manually create a tag for a past deployment:
```bash
# Find the commit that was deployed
COMMIT_SHA="abc123..."

# Create the tag
git tag -a "production-$(date -u '+%Y-%m-%d-%H%M%S')" $COMMIT_SHA \
  -m "Manual tag for production deployment"

# Push the tag
git push origin --tags
```

## Best Practices

1. **Don't delete production tags**: They serve as an audit trail
2. **Use tags for rollbacks**: Deploy tags rather than branches when rolling back
3. **Document significant deployments**: Add notes to the PR or issue for major releases
4. **Monitor tag creation**: Check that tags are being created successfully

## Future Enhancements

Potential improvements to the tagging system:
- Semantic versioning for major releases
- Automatic changelog generation
- GitHub Releases creation
- Deployment notifications with tag information
- Tag-based deployment validation