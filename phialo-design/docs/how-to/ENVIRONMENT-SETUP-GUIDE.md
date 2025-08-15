# Complete Environment Setup Guide for Phialo Design

This is the **single source of truth** for setting up deployment environments for the Phialo Design website. Follow these steps exactly to configure a new environment.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create GitHub Environment](#step-1-create-github-environment)
4. [Step 2: Get Cloudflare Credentials](#step-2-get-cloudflare-credentials)
5. [Step 3: Configure Web Analytics](#step-3-configure-web-analytics)
6. [Step 4: Configure Turnstile](#step-4-configure-turnstile)
7. [Step 5: Setup Email Service (Resend)](#step-5-setup-email-service-resend)
8. [Step 6: Add All Secrets to Environment](#step-6-add-all-secrets-to-environment)
9. [Step 7: Deploy](#step-7-deploy)
9. [Environment Reference](#environment-reference)
10. [Troubleshooting](#troubleshooting)

## Overview

**Important**: This project uses **environment-specific secrets only**. There are NO repository-level secrets or variables. Both environments (production and preview) must have ALL required secrets configured independently.

### Available Environments

| Environment | Purpose | URL | Branch |
|------------|---------|-----|--------|
| `production` | Live website | https://phialo.de | master |
| `preview` | PR previews | https://phialo-design-preview.meise.workers.dev | any |
| `master` | Latest master | https://phialo-master.meise.workers.dev | master |

## Prerequisites

Before starting, ensure you have:
- Admin access to the GitHub repository
- Access to a Cloudflare account
- Access to Resend (or ability to create account)
- Domain configured in Cloudflare (for production only)

## Step 1: Create GitHub Environment

1. **Navigate to GitHub Repository Settings**
   - Go to: `https://github.com/[your-org]/phialoastro`
   - Click `Settings` tab
   - In left sidebar, click `Environments`

2. **Create New Environment**
   - Click `New environment` button
   - Enter environment name: `production`, `preview`, or `master`
   - Click `Configure environment`

3. **Optional: Add Protection Rules (Production Only)**
   - Check `Required reviewers`
   - Add reviewer usernames
   - Check `Prevent self-review` if desired
   - Set deployment branches to `master` only

## Step 2: Get Cloudflare Credentials

### 2.1 Get Cloudflare Account ID

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Select your account (if you have multiple)

2. **Copy Account ID**
   - Look in the right sidebar
   - Find "Account ID" section
   - Click copy icon
   - Save as: `CLOUDFLARE_ACCOUNT_ID`

### 2.2 Create Cloudflare API Token

1. **Navigate to API Tokens**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click `Create Token` button

2. **Configure Token Permissions**
   - Choose `Custom token` option
   - Token name: `phialo-design-deployment`
   
   **Add these permissions:**
   - Account → Workers Scripts:Edit
   - Account → Workers KV Storage:Edit
   - Account → Workers Routes:Edit (for custom domain)
   - Zone → Zone:Read (for custom domain)

3. **Set Account Resources**
   - Account Resources: Select your specific account
   - Zone Resources: Include → Specific zone → phialo.de (if applicable)

4. **Create and Save Token**
   - Click `Continue to summary`
   - Review permissions
   - Click `Create Token`
   - **IMPORTANT**: Copy token immediately (shown only once!)
   - Save as: `CLOUDFLARE_API_TOKEN`

### 2.3 Configure Custom Domain (Production Only)

For production deployment to use a custom domain (e.g., phialo.de):

1. **Add Domain to Cloudflare**
   - Go to: https://dash.cloudflare.com
   - Click `Add a site`
   - Enter your domain name
   - Follow DNS configuration instructions

2. **Enable Workers Routes**
   - Navigate to your domain in Cloudflare dashboard
   - Go to `Workers Routes` section
   - The worker will automatically create the route during deployment

3. **Important Notes**
   - Production deployment requires the domain to be active in Cloudflare
   - The API token must have Zone permissions for the domain
   - If domain is not configured, production deployment will fail
   - For testing without a domain, use the preview environment instead

## Step 3: Configure Web Analytics

### 3.1 Create Web Analytics Site

1. **Navigate to Web Analytics**
   - Go to: https://dash.cloudflare.com
   - Select `Analytics & Logs` → `Web Analytics` from the sidebar

2. **Add New Site**
   - Click `Add a site` button
   - Site name: `phialo-design-[environment]`
   - Hostname: 
     - Production: `phialo.de`
     - Preview: `phialo-design-preview.meise.workers.dev`
     - Master: `phialo-master.meise.workers.dev`
   - Click `Done`

3. **Get Analytics Token**
   - After creating the site, you'll see a JavaScript snippet
   - Find the `token` value in the snippet (looks like: `{"token":"abc123..."}`)
   - Copy the token value (without quotes)
   - Save as: `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`

## Step 4: Configure Turnstile

### 4.1 Create Turnstile Site

1. **Navigate to Turnstile**
   - Go to: https://dash.cloudflare.com
   - Select `Turnstile` from the sidebar

2. **Add New Site**
   - Click `Add site` button
   - Widget name: `phialo-design-[environment]`
   - Domains: 
     - Production: `phialo.de`
     - Preview: `*.workers.dev`
     - Master: `phialo-master.meise.workers.dev`

3. **Configure Widget**
   - Widget Mode: `Managed`
   - Pre-clearance: `Enabled` (for production)
   - Action: `contact-form`

4. **Save Keys**
   - Copy Site Key → Save as: `PUBLIC_TURNSTILE_SITE_KEY`
   - Copy Secret Key → Save as: `TURNSTILE_SECRET_KEY`

## Step 5: Setup Email Service (Resend)

### 5.1 Create Resend Account

1. **Sign up for Resend**
   - Go to: https://resend.com/signup
   - Create account or login

2. **Add and Verify Domain**
   - Go to: https://resend.com/domains
   - Click `Add Domain`
   - Enter your domain (e.g., `phialo.de`)
   - Add DNS records as instructed
   - Wait for verification (usually < 5 minutes)

### 5.2 Create API Key

1. **Navigate to API Keys**
   - Go to: https://resend.com/api-keys
   - Click `Create API Key`

2. **Configure API Key**
   - Name: `phialo-design-[environment]`
   - Permissions: `Send emails`
   - Domain: Select your verified domain

3. **Save API Key**
   - Copy the key (shown only once!)
   - Save as: `RESEND_API_KEY`

### 5.3 Configure Email Addresses

- `FROM_EMAIL`: Use an email from your verified domain (e.g., `contact@phialo.de`)
- `TO_EMAIL`: Your business email where contact forms should be sent

## Step 6: Add All Secrets to Environment

Now add ALL 8 secrets to your GitHub environment:

1. **Go Back to GitHub Environment Settings**
   - Repository → Settings → Environments → [Your Environment]

2. **Add Each Secret** (Click "Add secret" for each)

   | Secret Name | Value | Description |
   |------------|-------|-------------|
   | `CLOUDFLARE_ACCOUNT_ID` | From Step 2.1 | Your Cloudflare account ID |
   | `CLOUDFLARE_API_TOKEN` | From Step 2.2 | API token with Workers permissions |
   | `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | From Step 3 | Web Analytics token for visitor metrics |
   | `PUBLIC_TURNSTILE_SITE_KEY` | From Step 4 | Public Turnstile key (starts with 0x4...) |
   | `TURNSTILE_SECRET_KEY` | From Step 4 | Secret Turnstile key |
   | `RESEND_API_KEY` | From Step 5.2 | Resend API key |
   | `FROM_EMAIL` | From Step 5.3 | Sender email (e.g., contact@phialo.de) |
   | `TO_EMAIL` | From Step 5.3 | Recipient email for forms |

3. **Verify All Secrets Added**
   - You should see exactly 8 secrets in the environment
   - Each secret should show "Updated" timestamp

## Step 7: Deploy

### Manual Deployment (Recommended)

1. **Navigate to GitHub Actions**
   - Go to repository → Actions tab
   - Select `Manual Cloudflare Deployment`

2. **Run Workflow**
   - Click `Run workflow`
   - Select environment (defaults to production)
   - Select branch (defaults to master)
   - Click `Run workflow` button

3. **Monitor Deployment**
   - Watch the workflow progress
   - Check for green checkmarks
   - Note the deployment URL in the summary

### Automatic Deployments

- **Production**: Manually triggered only
- **Master**: Automatically deploys on push to master branch
- **Preview**: Automatically creates PR preview on pull request

## Environment Reference

### Production Environment
```yaml
Name: production
URL: https://phialo.de
Branch: master
Protection: Required reviewers
Secrets: All 8 secrets required
```

### Preview Environment
```yaml
Name: preview  
URL: https://phialo-design-preview.meise.workers.dev
Branch: any (typically PR branches)
Protection: None
Secrets: All 8 secrets required
```

### Master Environment
```yaml
Name: master
URL: https://phialo-master.meise.workers.dev
Branch: master
Protection: None
Secrets: All 8 secrets required
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Bad credentials" error
- **Cause**: Invalid or missing CLOUDFLARE_API_TOKEN
- **Solution**: Regenerate token with correct permissions

#### 2. "Account ID is required" error
- **Cause**: Missing CLOUDFLARE_ACCOUNT_ID
- **Solution**: Add account ID to environment secrets

#### 3. "Turnstile validation failed"
- **Cause**: Mismatched or invalid Turnstile keys
- **Solution**: Verify both PUBLIC and SECRET keys match the same site

#### 4. "Email sending failed"
- **Cause**: Invalid Resend API key or unverified domain
- **Solution**: 
  - Verify domain in Resend dashboard
  - Regenerate API key if needed
  - Check FROM_EMAIL uses verified domain

#### 5. "Environment not found"
- **Cause**: GitHub environment not created
- **Solution**: Follow Step 1 to create environment

#### 6. Missing secrets in workflow
- **Cause**: Secrets not added to specific environment
- **Solution**: Ensure ALL 8 secrets are added to the environment

#### 8. "No analytics data showing"
- **Cause**: Missing or invalid PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN
- **Solution**: 
  - Verify the analytics token is correctly set in the environment
  - Check that the hostname matches the Web Analytics site configuration
  - Wait 5-10 minutes for data to appear after first visit

#### 7. "You need to register a workers.dev subdomain" error
- **Cause**: Production deployment requires custom domain but it's not configured
- **Solution**: 
  - Ensure your domain is added to Cloudflare (see Step 2.3)
  - Verify the domain is active and DNS is configured
  - Check that Zone permissions are included in your API token
  - For testing without a domain, use preview environment instead

### Verification Checklist

Before deploying, verify:
- [ ] GitHub environment exists
- [ ] All 8 secrets are configured in the environment
- [ ] Cloudflare account has Workers enabled
- [ ] For production: Domain is active in Cloudflare with DNS configured
- [ ] For production: API token includes Zone permissions
- [ ] Turnstile site is configured for your domain
- [ ] Resend domain is verified
- [ ] API tokens have correct permissions

### Getting Help

If you encounter issues not covered here:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly set (no extra spaces, correct format)
3. Ensure your Cloudflare account has the required services enabled
4. Contact repository maintainers with specific error messages

## Quick Reference Card

```bash
# Required Secrets (ALL must be set per environment)
CLOUDFLARE_ACCOUNT_ID       # From Cloudflare dashboard sidebar
CLOUDFLARE_API_TOKEN        # Create at dash.cloudflare.com/profile/api-tokens
PUBLIC_TURNSTILE_SITE_KEY   # From Turnstile configuration
TURNSTILE_SECRET_KEY        # From Turnstile configuration
RESEND_API_KEY              # From resend.com/api-keys
FROM_EMAIL                  # Your verified sender email
TO_EMAIL                    # Where to receive contact forms

# Deployment Commands (from GitHub Actions)
- Manual Deploy: Actions → Manual Cloudflare Deployment → Run workflow
- Select environment: production (default), preview, or master
- Select branch: master (default) or specific branch
```

---

**Last Updated**: 2025-01-10
**Maintained by**: Phialo Design Team