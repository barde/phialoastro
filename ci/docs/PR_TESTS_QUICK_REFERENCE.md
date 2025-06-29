# PR Tests Container Workflow - Quick Reference

## 🚀 Quick Start

### Which workflow should I use?

- **pr-tests.yml** - Current production workflow (non-containerized)
- **pr-tests-containerized.yml** - Basic container version (stable)
- **pr-tests-optimized.yml** - Advanced container version (fastest)

### Migration Timeline

1. **Week 1-2**: Run both original and containerized in parallel
2. **Week 3-4**: Switch to containerized as primary
3. **Week 5+**: Upgrade to optimized version

## 📊 Performance Comparison

| Feature | Original | Containerized | Optimized |
|---------|----------|---------------|-----------|
| Total Time | 3-4 min | 2-2.5 min | 1.5-2 min |
| Dependency Install | Yes (60s) | No | No |
| Parallel E2E | No | No | Yes |
| Pre-built Tools | No | Yes | Yes |
| Advanced Caching | No | Basic | Advanced |

## 🐳 Container Images

```bash
# Base image (unit tests, builds)
ghcr.io/debar/phialo-ci-base:latest

# Test image (E2E tests)
ghcr.io/debar/phialo-test:latest
```

## 🔧 Local Testing

### Run tests locally with containers

```bash
# Unit tests
docker run --rm -v $(pwd):/workspace \
  ghcr.io/debar/phialo-ci-base:latest \
  sh -c "cd phialo-design && pnpm test:run"

# E2E tests
docker run --rm -v $(pwd):/workspace \
  ghcr.io/debar/phialo-test:latest \
  sh -c "cd phialo-design && npx playwright test"
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission denied**
   ```yaml
   # Add to container config
   volumes:
     - /home/runner/work/_temp/_github_home:/github/home
   ```

2. **Cache not working**
   - Check cache keys include all relevant paths
   - Verify no syntax errors in cache configuration

3. **E2E tests failing**
   - Xvfb is pre-configured (DISPLAY=:99)
   - Ensure --shm-size=2gb for browser tests

## 📈 Monitoring

### Key Metrics to Track

- **Setup time**: Should be <10 seconds
- **Cache hit rate**: Target >80%
- **Total workflow time**: Target <2 minutes
- **Image pull time**: Should be <30 seconds

### Check Workflow Performance

```bash
# Use the comparison script
cd ci/scripts
./compare-workflows.sh
```

## 🔄 Updating Images

Images are automatically rebuilt:
- Weekly for security updates
- On changes to ci/ directory
- On manual trigger

## 💡 Best Practices

1. **Use specific image tags in production**
   ```yaml
   image: ghcr.io/debar/phialo-ci-base:v1.2.3
   ```

2. **Cache node_modules when possible**
   ```yaml
   - uses: actions/cache@v4
     with:
       path: phialo-design/node_modules
       key: ${{ runner.os }}-node-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

3. **Run critical tests only in PRs**
   - Use @critical tag for must-pass tests
   - Run full suite in nightly builds

## 📞 Support

- **Issues**: Create GitHub issue with workflow logs
- **Questions**: Tag in PR comments
- **Improvements**: Submit PR to workflow files

---

*Last updated: Phase 3 completion*