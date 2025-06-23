# CodeQL Migration to Default Setup

**Date**: June 2025  
**Issue**: #103  
**Decision**: Migrate from custom CodeQL workflow to GitHub's default setup  

## Problem

CodeQL security scanning was failing with the error:
```
CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled
```

This occurred because the repository had both:
1. GitHub's default CodeQL setup enabled (through repository settings)
2. A custom advanced CodeQL workflow (`.github/workflows/codeql.yml`)

## Analysis

### Current Custom Setup Review
- **No custom queries**: Using standard query suites
- **No custom build**: Using standard autobuild
- **No path exclusions**: Scanning entire codebase
- **Standard triggers**: Push, PR, and weekly schedule
- **Standard language**: JavaScript/TypeScript only

### Comparison with Default Setup
The custom workflow provided no additional features beyond what the default setup offers for this project.

## Decision

**Remove the custom CodeQL workflow and use GitHub's default setup.**

### Rationale
1. **Simplicity**: No workflow file to maintain
2. **Automatic updates**: CodeQL engine and queries update automatically
3. **Same coverage**: Identical security scanning capabilities
4. **Resolves conflict**: Eliminates the configuration conflict
5. **Best practice**: Recommended approach for projects without special requirements

## Migration Steps

### 1. Remove Custom Workflow
```bash
git rm .github/workflows/codeql.yml
git commit -m "fix: remove custom CodeQL workflow to resolve configuration conflict

Migrating to GitHub's default CodeQL setup as the custom workflow
provided no additional features and was causing upload failures due
to conflicting configurations.

Fixes #103"
```

### 2. Configure Default Setup
1. Go to repository **Settings** → **Code security and analysis**
2. Under **Code scanning**, click **Set up** → **Default**
3. Confirm **JavaScript/TypeScript** is selected
4. Enable the configuration
5. Optionally configure:
   - Query suites (default is sufficient)
   - Events (push, pull request, schedule)

### 3. Verify Migration
- Next push/PR will trigger CodeQL scan
- Check **Security** tab for scan results
- Verify no configuration errors

## Benefits of Default Setup

1. **Maintenance-free**: No workflow files to update
2. **Always current**: Automatic engine and query updates
3. **Simplified management**: Configure through UI
4. **Better integration**: Works seamlessly with GitHub Security features
5. **Organization scalability**: Easier to apply consistent policies

## When to Use Custom Setup

Consider custom CodeQL workflow only if you need:
- Custom query suites or specific queries
- Special build processes for compiled languages
- Path inclusions/exclusions
- Integration with third-party tools
- Custom scheduling beyond standard options
- Specific CodeQL CLI features

## Security Coverage

The default setup provides:
- All standard security queries for JavaScript/TypeScript
- Automatic detection of common vulnerabilities
- Coverage for client-side and server-side code
- React-specific security patterns
- Node.js security analysis

## References

- [GitHub CodeQL documentation](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/configuring-code-scanning-for-a-repository)
- [CodeQL default vs advanced setup](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/configuring-default-setup-for-code-scanning)
- Original issue: #103