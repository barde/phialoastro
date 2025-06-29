# Scripts Directory

This directory contains utility scripts for the Phialo Design project.

## Available Scripts

### clean-project.sh
Removes system files like .DS_Store and other junk files from the repository.
```bash
./scripts/clean-project.sh
```

### deploy.sh
Provides an easy way to trigger manual deployments to Cloudflare Workers.

```bash
# Show help
./scripts/deploy.sh --help

# Deploy current branch to preview
./scripts/deploy.sh

# Deploy master to production
./scripts/deploy.sh -e production -b master

# Deploy using GitHub Actions
./scripts/deploy.sh -m gh -e preview

# Deploy using API (requires GITHUB_TOKEN)
export GITHUB_TOKEN=your_token
./scripts/deploy.sh -m api -e production
```

#### Options:
- `-e, --environment`: Deployment environment (preview|production)
- `-b, --branch`: Branch to deploy (default: current branch)
- `-s, --skip-tests`: Skip tests before deployment
- `-m, --method`: Deployment method (cli|gh|api)
- `-h, --help`: Show help message

#### Methods:
- `cli`: Direct wrangler deployment (default, requires local setup)
- `gh`: GitHub Actions deployment (requires gh CLI)
- `api`: API webhook deployment (requires GITHUB_TOKEN)

## Adding New Scripts

When adding new scripts:
1. Make them executable: `chmod +x script-name.sh`
2. Add proper error handling and help text
3. Document them in this README
4. Use consistent naming (kebab-case with .sh extension)