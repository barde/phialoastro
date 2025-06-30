# Manual Deployment Methods

This guide covers all the ways to manually trigger Cloudflare Workers deployments without pushing code.

## Table of Contents
1. [GitHub Actions UI (workflow_dispatch)](#github-actions-ui)
2. [PR Comments (Bot Commands)](#pr-comments)
3. [Webhook API](#webhook-api)
4. [GitHub CLI](#github-cli)
5. [Direct Wrangler Commands](#direct-wrangler-commands)

## GitHub Actions UI

The easiest way to trigger manual deployments is through the GitHub Actions UI.

### Steps:
1. Go to the [Actions tab](https://github.com/barde/phialoastro/actions) in the repository
2. Click on "Manual Cloudflare Deployment" workflow
3. Click "Run workflow" button
4. Fill in the parameters:
   - **Environment**: Choose `preview` or `production`
   - **Branch**: Leave empty for current branch or specify a branch name
   - **Skip tests**: Check to skip tests (not recommended)
   - **Debug**: Enable debug logging
5. Click "Run workflow"

### Example Use Cases:
- Deploy a specific branch to preview for testing
- Emergency production deployment with test skip
- Deploy from a tag or specific commit

## PR Comments

You can trigger deployments directly from pull request comments using bot commands.

### Available Commands:
- `/deploy` or `/deploy-preview` - Deploy PR to preview environment
- `/deploy-production` - Deploy PR to production (requires approval)
- `/deploy-help` - Show help message

### Requirements:
- You must be a repository collaborator with write access
- The bot will react with 👍 if the command is accepted
- The bot will react with 👎 if you don't have permission

### Example:
```
/deploy-preview
```

The bot will:
1. React to your comment with 👍
2. Post a status comment
3. Deploy your PR
4. Post the deployment URL when complete

## Webhook API

Trigger deployments programmatically using GitHub's repository dispatch API.

### Endpoint:
```
POST https://api.github.com/repos/barde/phialoastro/dispatches
```

### Headers:
```
Authorization: Bearer YOUR_GITHUB_TOKEN
Accept: application/vnd.github.v3+json
Content-Type: application/json
```

### Payload for Preview Deployment:
```json
{
  "event_type": "deploy-preview",
  "client_payload": {
    "branch": "feature/my-branch",
    "callback_url": "https://your-webhook.com/callback"
  }
}
```

### Payload for Production Deployment:
```json
{
  "event_type": "deploy-production",
  "client_payload": {
    "branch": "master",
    "token": "optional-security-token",
    "callback_url": "https://your-webhook.com/callback"
  }
}
```

### Example with cURL:
```bash
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "deploy-preview",
    "client_payload": {
      "branch": "feature/new-design"
    }
  }' \
  https://api.github.com/repos/barde/phialoastro/dispatches
```

### Callback Response:
If you provide a `callback_url`, the workflow will POST back:
```json
{
  "status": "success",
  "environment": "preview",
  "url": "https://phialo-design-preview.meise.workers.dev",
  "deployed_at": "2025-06-29T10:30:00Z",
  "run_id": "123456789"
}
```

## GitHub CLI

Use the GitHub CLI to trigger deployments from your terminal.

### Install GitHub CLI:
```bash
# macOS
brew install gh

# Or download from https://cli.github.com/
```

### Trigger Manual Deployment:
```bash
# Login first
gh auth login

# Trigger preview deployment
gh workflow run manual-deploy.yml \
  -f environment=preview \
  -f branch=feature/my-branch \
  -f skip_tests=false

# Trigger production deployment
gh workflow run manual-deploy.yml \
  -f environment=production \
  -f branch=master
```

### Watch the deployment:
```bash
# List recent runs
gh run list --workflow=manual-deploy.yml

# Watch a specific run
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Trigger via Repository Dispatch:
```bash
# Preview deployment
gh api repos/barde/phialoastro/dispatches \
  --method POST \
  -H "Accept: application/vnd.github.v3+json" \
  -f event_type='deploy-preview' \
  -F 'client_payload[branch]=feature/my-branch'

# Production deployment
gh api repos/barde/phialoastro/dispatches \
  --method POST \
  -H "Accept: application/vnd.github.v3+json" \
  -f event_type='deploy-production' \
  -F 'client_payload[branch]=master'
```

## Direct Wrangler Commands

For local manual deployments, you can use Wrangler directly.

### Prerequisites:
```bash
# Authenticate with Cloudflare
npx wrangler login
# Or use API token
export CLOUDFLARE_API_TOKEN="your-token"
```

### Deploy Commands:

#### Preview Deployment:
```bash
# Build first
cd phialo-design
npm run build

# Deploy to preview
cd ../workers
npm run deploy:preview
```

#### Production Deployment:
```bash
# Build first
cd phialo-design
npm run build

# Deploy to production
cd ../workers
npm run deploy:production
```

#### Custom Preview for Testing:
```bash
# Deploy with custom name
cd workers
npx wrangler deploy --name phialo-test-feature --env preview
```

### Rollback Deployment:
```bash
# List deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback --env production
```

## Quick Reference

### Deployment URLs:
- **Production**: https://phialo.de
- **Preview**: https://phialo-design-preview.meise.workers.dev
- **PR Preview**: https://phialo-pr-{number}.meise.workers.dev

### Required Secrets:
- `CLOUDFLARE_API_TOKEN`: For authentication
- `CLOUDFLARE_ACCOUNT_ID`: Your account ID
- `WEB3FORMS_ACCESS_KEY`: For contact form

### Permissions:
- **GitHub Actions**: Requires repository write access
- **PR Comments**: Requires repository collaborator status
- **Webhook API**: Requires GitHub personal access token with `repo` scope
- **Direct Wrangler**: Requires Cloudflare API token

## Security Notes

1. **API Tokens**: Never commit tokens to the repository
2. **Production Deployments**: Always require manual approval
3. **Webhook Security**: Consider implementing token validation
4. **PR Deployments**: Automatically cleaned up on PR close
5. **Rate Limits**: GitHub API has rate limits for dispatches

## Troubleshooting

### Deployment Fails:
1. Check GitHub Actions logs
2. Verify secrets are configured
3. Ensure branch exists and is up to date
4. Check Cloudflare dashboard for worker status

### Permission Denied:
1. Verify you have repository write access
2. Check API token scopes
3. Ensure Cloudflare API token has correct permissions

### Worker Not Updating:
1. Clear browser cache
2. Check if deployment actually succeeded
3. Verify you're checking the correct URL
4. Use `wrangler tail` to see live logs

## Integration Examples

### Slack Integration:
```bash
# Deploy and notify Slack
gh workflow run manual-deploy.yml -f environment=preview && \
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Preview deployment triggered!"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### CI/CD Pipeline Integration:
```yaml
# In another CI system
- name: Trigger Phialo deployment
  run: |
    curl -X POST \
      -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
      -H "Accept: application/vnd.github.v3+json" \
      -d '{"event_type": "deploy-preview"}' \
      https://api.github.com/repos/barde/phialoastro/dispatches
```

### Monitoring Script:
```bash
#!/bin/bash
# monitor-deployment.sh

RUN_ID=$(gh workflow run manual-deploy.yml -f environment=preview --json | jq -r '.run_id')
echo "Started deployment: $RUN_ID"

# Wait for completion
gh run watch $RUN_ID

# Get status
STATUS=$(gh run view $RUN_ID --json conclusion -q '.conclusion')
echo "Deployment $STATUS"
```