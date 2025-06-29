# Setting Up GitHub Secrets for Cloudflare Deployment

This guide walks you through setting up the required GitHub secrets for automated Cloudflare Workers deployments.

## Required Secrets

The following secrets must be configured in your GitHub repository for the deployment workflows to function:

1. **CLOUDFLARE_API_TOKEN** - API token for Cloudflare authentication
2. **CLOUDFLARE_ACCOUNT_ID** - Your Cloudflare account ID
3. **CLOUDFLARE_ZONE_ID** - Your domain's zone ID
4. **WEB3FORMS_ACCESS_KEY** - API key for the contact form service (optional)

## Step 1: Create Cloudflare API Token

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **My Profile** → **API Tokens** (or visit https://dash.cloudflare.com/profile/api-tokens)
3. Click **Create Token**
4. Use the **Custom token** template
5. Configure the token with these permissions:

   **Token name**: `GitHub Actions - Phialo Design`

   **Permissions**:
   - Account → Workers Scripts:Edit
   - Account → Workers KV Storage:Edit  
   - Account → Account Settings:Read
   - Zone → Zone:Read (select specific zone: phialo.de)
   - Zone → Workers Routes:Edit (select specific zone: phialo.de)

   **Account Resources**:
   - Include → All accounts (or select your specific account)

   **Zone Resources**:
   - Include → Specific zone → phialo.de

   **IP Filtering** (optional but recommended):
   - You can restrict to GitHub's IP ranges for extra security

6. Click **Continue to summary** → **Create Token**
7. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

## Step 2: Find Your Cloudflare Account ID

1. In the Cloudflare Dashboard, select any domain
2. Look at the right sidebar under **API** section
3. Copy your **Account ID** (looks like: `abc123def456...`)

Alternatively:
- Go to https://dash.cloudflare.com/
- The URL will contain your account ID: `https://dash.cloudflare.com/[ACCOUNT_ID]/...`

## Step 3: Get Web3Forms Access Key (Optional)

If you're using the contact form:

1. Visit [Web3Forms](https://web3forms.com)
2. Sign up or log in
3. Create a new form or use existing
4. Copy your Access Key from the dashboard

## Step 4: Add Secrets to GitHub Repository

1. Go to your GitHub repository (https://github.com/barde/phialoastro)
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret:

### Secret 1: CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: The token you created in Step 1
- Click **Add secret**

### Secret 2: CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: Your account ID from Step 2
- Click **Add secret**

### Secret 3: WEB3FORMS_ACCESS_KEY (Optional)
- **Name**: `WEB3FORMS_ACCESS_KEY`
- **Value**: Your Web3Forms access key from Step 3
- Click **Add secret**

## Step 5: Update Zone ID in wrangler.toml

1. Find your Zone ID:
   - Go to Cloudflare Dashboard → Select **phialo.de**
   - Look at the right sidebar under **API** section
   - Copy your **Zone ID**

2. Update `workers/wrangler.toml`:
   ```toml
   [env.production]
   name = "phialo-design"
   route = "phialo.de/*"
   zone_id = "YOUR_ACTUAL_ZONE_ID_HERE"  # Replace with your actual Zone ID
   workers_dev = false
   ```

## Verifying Your Setup

After adding all secrets:

1. Create a test PR or push to a branch
2. Check the **Actions** tab in your repository
3. Look for the "Deploy to Cloudflare Workers" workflow
4. If successful, you'll see:
   - ✅ Build Astro site
   - ✅ Create Preview Deployment
   - 💬 Comment with preview URL on PR

## Troubleshooting

### Authentication Error
```
✘ [ERROR] Authentication error: Invalid API token
```
**Solution**: Verify your CLOUDFLARE_API_TOKEN has the correct permissions and hasn't expired.

### Account ID Error
```
✘ [ERROR] Account ID is required
```
**Solution**: Make sure CLOUDFLARE_ACCOUNT_ID is set correctly in GitHub secrets.

### Zone ID Error
```
✘ [ERROR] Invalid zone ID
```
**Solution**: Update the zone_id in wrangler.toml with your actual Zone ID from Cloudflare dashboard.

### Missing Permissions
```
✘ [ERROR] Unauthorized: You need Workers Scripts:Edit permissions
```
**Solution**: Your API token needs additional permissions. Create a new token with all required permissions listed above.

## Security Best Practices

1. **Use minimal permissions**: Only grant the permissions actually needed
2. **Rotate tokens regularly**: Create new tokens periodically and update GitHub secrets
3. **Use IP filtering**: Restrict API token to GitHub's IP ranges if possible
4. **Monitor usage**: Check Cloudflare's audit log for any unusual activity
5. **Don't commit secrets**: Never commit API tokens or secrets to your repository

## GitHub Actions IP Ranges

If you want to restrict your Cloudflare API token to GitHub's IP addresses, use these ranges:
- See current list at: https://api.github.com/meta (look for "actions" array)

## Next Steps

Once all secrets are configured:
1. The deployment workflow will run automatically on PRs and pushes
2. Preview deployments will be created for all PRs
3. Production deployments will happen when merging to master
4. Check PR comments for preview URLs

For more information about the deployment process, see [Cloudflare Preview Deployments](./cloudflare-preview-deployments.md).