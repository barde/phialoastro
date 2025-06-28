# E2E Sharded Tests - Quick Reference

## 🚀 Quick Start

### Run with defaults (all browsers, 4 shards each)
```bash
gh workflow run e2e-sharded.yml
```

### Run specific browser with custom shards
```bash
gh workflow run e2e-sharded.yml -f browsers="chromium" -f shards="2"
```

### Run tagged tests only
```bash
gh workflow run e2e-sharded.yml -f test_tag="@critical"
```

## 📊 Performance Stats

| Configuration | Execution Time | Runner Minutes |
|--------------|----------------|----------------|
| Default (3 browsers, 4 shards) | ~3-4 minutes | ~65 minutes |
| Single browser, 2 shards | ~2 minutes | ~15 minutes |
| All browsers, 8 shards | ~2 minutes | ~120 minutes |
| Smoke tests only | <1 minute | ~5 minutes |

## 🎯 Common Scenarios

### PR Testing (Fast Feedback)
```bash
# Minimal configuration for quick PR validation
gh workflow run e2e-sharded.yml \
  -f browsers="chromium" \
  -f shards="2" \
  -f test_tag="@critical"
```

### Pre-Release Testing (Comprehensive)
```bash
# Maximum coverage before release
gh workflow run e2e-sharded.yml \
  -f browsers="chromium,firefox,webkit" \
  -f shards="6"
```

### Debug Failing Tests
```bash
# Single shard for easier debugging
gh workflow run e2e-sharded.yml \
  -f browsers="chromium" \
  -f shards="1"
```

## 🔧 Workflow Inputs

| Input | Description | Default | Examples |
|-------|-------------|---------|----------|
| `test_tag` | Grep pattern for test filtering | none | `@critical`, `@smoke`, `login` |
| `browsers` | Comma-separated browser list | `chromium,firefox,webkit` | `chromium`, `firefox,webkit` |
| `shards` | Number of parallel shards | `4` | `1`, `2`, `4`, `8` |

## 📈 Optimization Guidelines

### Shard Count Selection

| Test Suite Size | Recommended Shards | Rationale |
|----------------|-------------------|-----------|
| <50 tests | 1-2 shards | Minimal overhead |
| 50-200 tests | 2-4 shards | Good balance |
| 200-500 tests | 4-6 shards | Optimal parallelization |
| >500 tests | 6-8 shards | Maximum speed |

### Browser Selection Strategy

- **Development**: Single browser (chromium) for speed
- **PR Validation**: Chromium + one other browser
- **Pre-release**: All browsers for full coverage
- **Hotfixes**: Chromium only for rapid deployment

## 🐛 Troubleshooting

### Workflow not starting
```bash
# Check workflow syntax
yamllint .github/workflows/e2e-sharded.yml

# Check permissions
gh workflow list
```

### Tests failing in containers
```bash
# Run with debug logging
gh workflow run e2e-sharded.yml \
  -f browsers="chromium" \
  -f shards="1" \
  --ref $BRANCH_NAME
```

### Container pull issues
```bash
# Verify image availability
docker pull ghcr.io/$GITHUB_OWNER/phialo-test:latest

# Check authentication
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin
```

## 📊 Monitoring Commands

### View recent runs
```bash
gh run list --workflow=e2e-sharded.yml --limit 10
```

### Watch live execution
```bash
gh run watch
```

### Download test artifacts
```bash
# List artifacts from latest run
gh run download -n playwright-report-merged

# Download specific artifact
gh run download $RUN_ID -n test-results-chromium-1
```

## 💡 Pro Tips

1. **Optimize for PR speed**: Use 2 shards with Chromium only
2. **Weekend runs**: Schedule comprehensive tests with all browsers
3. **Flaky test detection**: Run with single shard to isolate issues
4. **Resource monitoring**: Check Actions usage tab regularly
5. **Cache warming**: Run workflow after dependency updates

## 🔄 Integration Examples

### With PR checks
```yaml
# In your PR template
- [ ] E2E tests passing (chromium, 2 shards)
- [ ] E2E tests passing (all browsers) - for major changes
```

### With deployment pipeline
```bash
# Pre-deployment validation
gh workflow run e2e-sharded.yml \
  -f test_tag="@critical" \
  -f browsers="chromium,firefox" \
  --ref $RELEASE_BRANCH

# Wait for completion
gh run watch
```

### With monitoring
```bash
# Add to monitoring dashboard
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/workflows/e2e-sharded.yml/runs" \
  | jq '.workflow_runs[0] | {status: .status, conclusion: .conclusion, duration: .updated_at}'
```

## 📝 Workflow Outputs

### Test Summary Location
- **GitHub UI**: Actions tab → Workflow run → Summary
- **PR Comment**: Automated comment with results
- **Artifacts**: `playwright-report-merged` for full HTML report

### Metrics Available
- Total tests run
- Pass/fail/skip counts
- Execution duration
- Flaky test detection
- Per-browser results

## 🚄 Performance Comparison

### Traditional vs Sharded Containerized

| Metric | Traditional | Containerized Sharded | Improvement |
|--------|-------------|----------------------|-------------|
| Setup time | 2 min/job | 10 sec/job | 92% faster |
| Test execution | Serial: 15 min | Parallel: 3 min | 80% faster |
| Total time | ~20 min | ~4 min | 80% faster |
| Scalability | Limited | Excellent | ♾️ |

Remember: More shards = faster completion but higher resource usage. Find your optimal balance!