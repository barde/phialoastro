# How to Use Pre-Push Hooks

This guide explains how to use the pre-push hooks implemented with Lefthook to prevent CI failures.

## Overview

Pre-push hooks automatically run checks before your code is pushed to the remote repository, catching issues early and preventing CI failures.

## Installation

The hooks are automatically installed when you run `npm install` in the `phialo-design` directory. If they're not working, you can manually install them:

```bash
cd phialo-design
npx lefthook install
```

## What Gets Checked

### Pre-Commit Hooks (Quick Checks < 5 seconds)

1. **File Size Check**: Prevents committing files larger than 5MB
2. **Prohibited Files**: Blocks .DS_Store, .log, .zip, and workflow.log files

### Pre-Push Hooks (Comprehensive Checks < 2 minutes)

1. **Project Cleanup**: Runs the clean-project.sh script
2. **TypeScript Check**: Validates TypeScript types with `npm run typecheck`
3. **ESLint**: Checks code quality with `npm run lint`
4. **Unit Tests**: Runs all unit tests with `npm run test:run`
5. **Build Check**: Ensures the project builds successfully
6. **Large File Warning**: Warns about files larger than 10MB

## Usage

### Normal Workflow

Just use git as normal. The hooks run automatically:

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"  # Pre-commit hooks run here
git push                               # Pre-push hooks run here
```

### Bypassing Hooks (Emergency Only)

In emergency situations, you can bypass hooks:

```bash
# Bypass pre-commit hooks
git commit --no-verify -m "hotfix: urgent fix"

# Bypass pre-push hooks
git push --no-verify
```

**Warning**: Only bypass hooks for critical hotfixes. The CI will still run these checks.

## Troubleshooting

### Hooks Not Running

1. Ensure Lefthook is installed:
   ```bash
   npx lefthook install
   ```

2. Check if hooks are properly configured:
   ```bash
   npx lefthook run pre-push
   ```

### Hook Failures

If a hook fails, read the error message carefully. Common issues:

1. **TypeScript errors**: Fix type issues with `npm run typecheck`
2. **ESLint errors**: Fix or disable rules with `npm run lint:fix`
3. **Test failures**: Run `npm run test` to debug
4. **Build failures**: Check `npm run build` output

### Performance Issues

If hooks are too slow:

1. Use `--no-verify` temporarily while iterating
2. Run individual checks manually:
   ```bash
   npm run typecheck
   npm run lint
   npm run test:run
   ```

## Available Commands

```bash
# Individual checks
npm run typecheck      # Check TypeScript types
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix ESLint issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
npm run test:run       # Run unit tests once
npm run build          # Build the project

# Combined check
npm run pre-push       # Run all pre-push checks manually
```

## Configuration

The hook configuration is in `phialo-design/lefthook.yml`. Key settings:

- `parallel: true` - Runs checks in parallel for speed
- `skip: [merge, rebase]` - Skips hooks during merge/rebase
- File globs limit checks to relevant files only

## Best Practices

1. **Fix issues locally**: Don't rely on CI to catch problems
2. **Keep hooks fast**: Report slow hooks as issues
3. **Don't bypass regularly**: If you bypass often, the check might be too strict
4. **Update hooks**: Keep dependencies and configurations current

## See Also

- [Lefthook Documentation](https://github.com/evilmartians/lefthook)
- [ESLint Configuration](../phialo-design/eslint.config.js)
- [Prettier Configuration](../phialo-design/.prettierrc.json)