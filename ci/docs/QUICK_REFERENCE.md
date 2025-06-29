# CI/CD Pipeline Quick Reference

## 🚀 Quick Commands

### Local Development
```bash
# Build images locally
cd ci
make build          # Base image
make build-test     # Test image
make build-deploy   # Deploy image

# Run tests
make test           # Test base image
make e2e            # Run E2E tests
make test-deploy    # Test deployment image

# Interactive shells
make shell          # Base image shell
make e2e-shell      # Test image shell
make deploy-shell   # Deploy image shell
```

### Using GitHub Registry Images
```bash
# Login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull latest images
docker pull ghcr.io/[owner]/phialo-ci-base:latest
docker pull ghcr.io/[owner]/phialo-test:latest
docker pull ghcr.io/[owner]/phialo-build-deploy:latest
```

## 📋 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `docker-images.yml` | Push to main, PR, Weekly | Main CI/CD pipeline |
| `docker-pr-builds.yml` | Pull requests | PR-specific builds |
| `docker-security-updates.yml` | Daily 3 AM UTC | Security scanning |
| `docker-cleanup.yml` | Weekly Sunday 4 AM | Registry cleanup |

## 🏷️ Image Tags

### Standard Tags
- `latest` - Latest from main branch
- `pr-123-ci-base` - PR-specific build
- `main-abc1234` - Branch + commit SHA
- `2024.01.15.123` - Date-based version

### Image Names
- `ghcr.io/[owner]/phialo-ci-base` - Base Node.js image
- `ghcr.io/[owner]/phialo-test` - Playwright test image
- `ghcr.io/[owner]/phialo-build-deploy` - Build/deploy image

## 🔧 Manual Workflow Dispatch

### Rebuild All Images
```bash
gh workflow run docker-images.yml \
  -f force_rebuild=true \
  -f target_image=all
```

### Security Scan with Custom Threshold
```bash
gh workflow run docker-security-updates.yml \
  -f severity_threshold=MEDIUM
```

### Cleanup with Dry Run
```bash
gh workflow run docker-cleanup.yml \
  -f dry_run=true \
  -f keep_days=14 \
  -f keep_versions=3
```

## 🐳 Docker Commands

### Run E2E Tests
```bash
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/[owner]/phialo-test:latest \
  pnpm test:e2e
```

### Build Production
```bash
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/[owner]/phialo-build-deploy:latest \
  /scripts/build.sh
```

### Deploy to Cloudflare
```bash
docker run --rm \
  -e CLOUDFLARE_API_TOKEN=$TOKEN \
  -e CLOUDFLARE_ACCOUNT_ID=$ACCOUNT \
  -v $(pwd):/workspace \
  ghcr.io/[owner]/phialo-build-deploy:latest \
  /scripts/deploy.sh
```

## 🔍 Debugging

### View Workflow Runs
```bash
# List recent runs
gh run list --workflow=docker-images.yml --limit 10

# View specific run
gh run view <run-id>

# Watch run in progress
gh run watch <run-id>
```

### Check Image Details
```bash
# Inspect image
docker inspect ghcr.io/[owner]/phialo-ci-base:latest

# View image labels
docker inspect ghcr.io/[owner]/phialo-ci-base:latest \
  --format='{{json .Config.Labels}}' | jq

# Check image size
docker images ghcr.io/[owner]/phialo-*
```

### Registry Management
```bash
# List packages
gh api user/packages?package_type=container

# Get package versions
gh api user/packages/container/phialo-ci-base/versions
```

## 📊 Image Sizes

| Image | Size | Purpose |
|-------|------|---------|
| `phialo-ci-base` | ~230MB | Base with Node.js 20 |
| `phialo-test` | ~800MB | E2E with browsers |
| `phialo-build-deploy` | ~500MB | Build & deployment |

## 🛡️ Security

### Manual Security Scan
```bash
# Scan with Trivy
trivy image ghcr.io/[owner]/phialo-ci-base:latest

# Check for specific severity
trivy image --severity HIGH,CRITICAL \
  ghcr.io/[owner]/phialo-ci-base:latest
```

### View Security Alerts
- Go to repository → Security tab → Code scanning alerts
- Check GitHub issues with "security" label

## 🧹 Cleanup

### Remove Local Images
```bash
# Remove all phialo images
docker rmi $(docker images 'phialo-*' -q)

# Prune unused images
docker image prune -a
```

### Trigger Registry Cleanup
```bash
# Dry run first
gh workflow run docker-cleanup.yml -f dry_run=true

# Actual cleanup
gh workflow run docker-cleanup.yml -f dry_run=false
```

## 📝 Environment Variables

### Required for Deployment
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `WEB3FORMS_ACCESS_KEY` - Contact form key

### CI/CD Variables
- `GITHUB_TOKEN` - Automatically provided in Actions
- `REGISTRY` - Set to `ghcr.io`
- `IMAGE_PREFIX` - Set to `[owner]/phialo`

## 🆘 Common Issues

### Authentication Failed
```bash
# Re-authenticate
echo $PAT | docker login ghcr.io -u USERNAME --password-stdin
```

### Build Cache Issues
```bash
# Clear builder cache
docker builder prune -a

# Force rebuild without cache
docker build --no-cache .
```

### Workflow Not Triggering
- Check path filters in workflow
- Verify branch protection rules
- Check workflow permissions

## 📚 More Information

- [Full CI/CD Documentation](./CI_CD_PIPELINE.md)
- [Docker Build Process](./BUILD_PROCESS.md)
- [Deployment Guide](./DEPLOY_IMAGE.md)
- [Testing Guide](./TEST_IMAGE.md)