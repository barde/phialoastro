# Deployment Quick Reference

## 🚀 Common Commands

### Local Development
```bash
# Astro only (recommended for development)
cd phialo-design && npm run dev

# Worker + Astro (production-like)
cd phialo-design && npm run dev:full

# Worker only (after building Astro)
cd workers && npm run dev
```

### Deployment
```bash
# Deploy preview (from workers/)
npm run deploy:preview

# Deploy production (⚠️ be careful!)
npm run deploy:production

# View logs
npm run tail
```

### Building
```bash
# Build Astro site
cd phialo-design && npm run build

# Build Worker
cd workers && npm run build
```

## 📋 Pre-Deployment Checklist

### For PR Previews
- [ ] GitHub secrets configured (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [ ] Changes pushed to PR branch
- [ ] Workflow triggered automatically

### For Production
- [ ] On main branch (`git checkout main`)
- [ ] Latest changes pulled (`git pull origin main`)
- [ ] Tests passing
- [ ] Preview deployment tested
- [ ] Zone ID configured in `wrangler.toml`

## 🔍 Quick Debugging

### Check Deployment Status
```bash
npx wrangler deployments list
```

### View Error Logs
```bash
# Real-time logs
cd workers && npm run tail

# GitHub Actions logs
gh run list --workflow=worker-preview.yml
gh run view <run-id> --log-failed
```

### Test Locally
```bash
# Test with production build
cd phialo-design && npm run build
cd ../workers && npm run preview
```

## 🔗 Important URLs

- **Local Dev**: http://localhost:4321 (Astro) or http://localhost:8787 (Worker)
- **Preview**: https://phialo-design-preview.{subdomain}.workers.dev
- **Production**: https://phialo.de (after custom domain setup)

## ⚡ Emergency Rollback

```bash
# List recent deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback --env production

# Or deploy a specific commit
git checkout <commit-hash>
cd phialo-design && npm run build
cd ../workers && npm run deploy:production
```

## 📝 Notes

- Preview deployments are isolated per PR
- Production requires proper `zone_id` in `wrangler.toml`
- Workers have 10ms CPU limit (usually not an issue for static sites)
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions