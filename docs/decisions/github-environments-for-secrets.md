# GitHub Environments for Secure Secret Management

## Current Issue

PR preview deployments are using repository-level secrets, which poses security risks:
- Secrets are accessible to all workflows
- No environment-specific isolation
- Potential exposure to forked PRs

## Solution: GitHub Environments

### 1. Environment Structure

We should create three GitHub environments:

1. **`development`** - For local development reference
2. **`preview`** - For PR preview deployments
3. **`production`** - For production deployments

### 2. Environment Configuration

#### Preview Environment
- **Protection Rules**: 
  - No approval required (for quick PR testing)
  - Deployment branches: All branches
- **Secrets**:
  - `RESEND_API_KEY` (test API key)
  - `FROM_EMAIL` (onboarding@resend.dev)
  - `TO_EMAIL` (test email)
- **Environment URL**: `https://phialo-pr-*.meise.workers.dev`

#### Production Environment
- **Protection Rules**:
  - Required reviewers: 1-2 maintainers
  - Deployment branches: `main`, `master`
  - Wait timer: Optional (5-10 minutes)
- **Secrets**:
  - `RESEND_API_KEY` (production API key)
  - `FROM_EMAIL` (noreply@phialo.de)
  - `TO_EMAIL` (info@phialo.de)
- **Environment URL**: `https://phialo.de`

### 3. Setup Instructions

#### Create Environments in GitHub:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Create `preview` environment:
   ```
   Name: preview
   Environment URL: https://phialo-pr-${{ github.event.pull_request.number }}.meise.workers.dev
   ```
4. Add environment secrets
5. Repeat for `production` environment

#### Configure Protection Rules:

For `production`:
1. Click on the environment
2. Under **Deployment protection rules**:
   - ✅ Required reviewers
   - Add reviewers
   - ✅ Restrict deployment branches
   - Add: `main`, `master`

### 4. Updated Workflow Configuration

The workflow should reference the environment:

```yaml
jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    environment: 
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    steps:
      # ... deployment steps
```

### 5. Benefits

1. **Security**: Secrets are scoped to environments
2. **Audit Trail**: All deployments are logged
3. **Approval Process**: Production requires approval
4. **Fork Safety**: Forked PRs can't access secrets without approval
5. **Environment URLs**: Clear tracking of deployments

### 6. Migration Path

1. Create environments in GitHub UI
2. Move secrets from repository to environment level
3. Update workflows to use `environment:` key
4. Test with a new PR
5. Remove repository-level secrets

## References

- [GitHub Docs: Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Docs: Environment secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-an-environment)
- [GitHub Docs: Environment protection rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)