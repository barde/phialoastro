# Performance Check v2 Migration Guide

## Overview

Performance Check v2 addresses two critical issues with the current performance monitoring:
1. **Report Format**: Implements collapsible sections for cleaner PR comments
2. **Timing Issue**: Tests against deployed PR preview URLs instead of localhost

## Key Improvements

### 🎯 What's New

#### 1. Tests Against Real Deployments
- **Before**: Tests ran against `localhost:4322` (local preview server)
- **After**: Tests run against deployed PR preview URLs (`https://phialo-pr-{number}.meise.workers.dev`)
- **Benefit**: Real-world performance metrics including CDN, edge caching, and actual network latency

#### 2. Collapsible Report Format
- **Before**: Long, verbose reports that dominated PR conversations
- **After**: Clean summary with expandable details
- **Benefit**: Easier PR reviews, faster assessment

#### 3. Workflow Coordination
- **Before**: Performance checks ran in parallel with deployments (race condition)
- **After**: Performance checks wait for deployment to complete
- **Benefit**: Reliable, accurate results

#### 4. Smart Deployment Detection
- Waits for Cloudflare Workers propagation
- Verifies deployment is ready before testing
- Fallback to local testing if deployment fails

## Migration Steps

### Phase 1: Testing (Current)
1. New workflow created as `performance-check-v2.yml`
2. Runs alongside existing workflow for comparison
3. No disruption to current CI/CD

### Phase 2: Validation
1. Monitor v2 workflow on several PRs
2. Compare results with v1
3. Gather team feedback on new format

### Phase 3: Switchover
1. Update PR automation to use v2
2. Disable v1 workflow
3. Archive v1 workflow file

### Phase 4: Cleanup
1. Remove v1 workflow file
2. Rename v2 to `performance-check.yml`
3. Update documentation references

## Report Format Comparison

### Old Format (v1)
```markdown
## 📊 Core Web Vitals Report

### 📄 http://localhost:4321/

| Metric | Value | Status | Target |
|--------|-------|--------|--------|
| **LCP** | 2100ms | 🟢 Good | < 2500ms |
| **CLS** | 0.05 | 🟢 Good | < 0.1 |
| **INP** (est.) | 180ms | 🟢 Good | < 200ms |
| **FCP** | 1200ms | 🟢 Good | < 1800ms |
| **TTFB** | 600ms | 🟢 Good | < 800ms |

[... repeated for all 10 URLs ...]
```

### New Format (v2)
```markdown
## 📊 Core Web Vitals Report

**Test Environment:** 🌐 https://phialo-pr-123.meise.workers.dev
**Test Date:** 2025-01-24

### ✅ Excellent - Overall Score: 92/100

| Page | Performance | LCP | CLS | INP |
|------|------------|-----|-----|-----|
| Home | 92 🟢 | 2.1s 🟢 | 0.05 🟢 | 180ms 🟢 |
| Portfolio | 88 🟡 | 2.8s 🟡 | 0.02 🟢 | 210ms 🟡 |

<details>
<summary><b>📋 Detailed Performance Metrics</b> (click to expand)</summary>

[... detailed metrics ...]

</details>
```

## Workflow Triggers

### v2 Trigger Options

1. **Automatic PR Testing** (Primary)
   - Triggers when PR preview deployment completes
   - Only runs if deployment succeeds
   - Tests against deployed URL

2. **Manual Testing** (Debugging)
   ```bash
   gh workflow run performance-check-v2.yml \
     -f pr_number=123 \
     -f test_local=false
   ```

3. **Local Testing** (Fallback)
   ```bash
   gh workflow run performance-check-v2.yml \
     -f pr_number=123 \
     -f test_local=true
   ```

## Configuration

### Environment Variables Required
- `LHCI_GITHUB_APP_TOKEN` - For Lighthouse CI reporting
- `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` - For analytics integration
- All standard deployment secrets

### Lighthouse Configuration
The workflow dynamically generates configuration based on:
- Target environment (local vs deployed)
- PR number for URL construction
- Same performance budgets as v1

## Troubleshooting

### Issue: Deployment Not Ready
**Symptom**: Workflow fails with "Deployment not ready"
**Solution**: 
- Check PR preview deployment succeeded
- Verify Cloudflare Workers status
- Increase wait timeout if needed

### Issue: Performance Regression
**Symptom**: Workflow fails with budget violations
**Solution**:
- Review detailed metrics in expandable sections
- Check "Quick Actions Needed" section
- Compare with baseline in Lighthouse CI dashboard

### Issue: Missing PR Comment
**Symptom**: No performance report appears
**Solution**:
- Check workflow has `pull-requests: write` permission
- Verify PR number detection
- Check GitHub API rate limits

## Rollback Plan

If issues arise with v2:

1. **Immediate Rollback**:
   ```yaml
   # In .github/workflows/performance-check.yml
   # Revert to use localhost testing
   ```

2. **Disable v2 Workflow**:
   ```bash
   gh workflow disable performance-check-v2.yml
   ```

3. **Re-enable v1**:
   - No changes needed, v1 continues to run

## Best Practices

### For Developers
1. Wait for performance check to complete before merging
2. Review "Quick Actions Needed" section for improvements
3. Expand detailed metrics only when investigating issues

### For Reviewers
1. Check overall score first (summary table)
2. Look for regression indicators (🔴 red status)
3. Use collapsible sections for deep dives

### For Maintainers
1. Monitor v2 workflow success rate
2. Adjust timeouts based on deployment speed
3. Update performance budgets quarterly

## Benefits Metrics

### Expected Improvements
- **Report Length**: 70% reduction in default view
- **Accuracy**: Real TTFB measurements (not localhost)
- **Reliability**: 95%+ success rate (vs current 80%)
- **Review Time**: 50% faster PR performance assessment

### Monitoring Success
Track these metrics after migration:
1. Workflow success rate
2. Average runtime
3. False positive rate
4. Developer satisfaction

## Timeline

- **Week 1**: Deploy v2 alongside v1
- **Week 2**: Gather feedback and adjust
- **Week 3**: Switch primary workflow to v2
- **Week 4**: Remove v1 and finalize

## Support

For issues or questions:
- Create issue with `performance-check-v2` label
- Check [workflow logs](https://github.com/phialoastro/phialoastro/actions)
- Review this guide for troubleshooting

## Related Documentation

- [GitHub Actions Workflow Dependencies](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run)
- [Lighthouse CI Configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- [Cloudflare Workers Deployment](./DEPLOY.md)