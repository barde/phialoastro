# Lima VM with Docker - Alternative to Docker Desktop

## Overview

This issue documents the successful setup of Lima VM with Docker as a free, lightweight alternative to Docker Desktop on macOS. This was implemented to support the containerized CI/CD strategy discussed in PR #135.

## Background

While working on issue #134 (Homepage improvements) and PR #135, we explored containerization to speed up CI/CD builds. Docker Desktop has licensing restrictions for larger teams, so we implemented Lima (Linux-on-Mac) as an alternative solution.

## Implementation Details

### What is Lima?

Lima is a lightweight VM manager for macOS that:
- Uses Apple's native Virtualization.framework for optimal performance
- Provides automatic file sharing between macOS and Linux
- Offers built-in port forwarding
- Supports multiple simultaneous VMs
- Is completely free and open source

### Setup Components

1. **Lima VM Configuration** (`~/.lima/ubuntu-docker.yaml`)
   - Ubuntu 24.04 LTS
   - 4 CPUs, 8GB RAM, 60GB disk
   - Docker CE installed via official repos
   - Automatic file sharing for home directory

2. **Automation Script** (`setup-lima-docker.sh`)
   - One-command setup
   - Checks prerequisites
   - Configures VM and Docker
   - Provides usage instructions

3. **Documentation**
   - `lima-docker-setup.md`: Comprehensive setup guide
   - `lima-docker-working.md`: Quick reference for daily use

### Key Features

- **Docker Access**: `limactl shell ubuntu-docker -- docker <command>`
- **File Sharing**: Home directory automatically mounted
- **Port Forwarding**: Services accessible on localhost
- **SSH Access**: Full Ubuntu VM access when needed

### Performance Benefits

- Faster than Docker Desktop
- Lower memory usage
- Native Apple Silicon support with Rosetta
- No licensing restrictions

## Usage Examples

```bash
# Run Docker commands
limactl shell ubuntu-docker -- docker run hello-world

# Build Phialo Design project
cd ~/code/phialoastro/phialo-design
limactl shell ubuntu-docker -- docker compose build

# Enter the VM
limactl shell ubuntu-docker

# Create convenient alias
alias docker="limactl shell ubuntu-docker -- docker"
```

## Integration with CI/CD Strategy

This Lima setup complements the containerized CI/CD strategy by:
1. Providing local Docker environment matching CI
2. Enabling fast local testing of Docker builds
3. Supporting the same Docker Compose files
4. Allowing developers without Docker Desktop licenses to contribute

## Files Created

- `/Users/debar/code/phialoastro/lima-docker-setup.md` - Setup guide
- `/Users/debar/code/phialoastro/lima-docker-working.md` - Quick reference
- `/Users/debar/code/phialoastro/setup-lima-docker.sh` - Automation script

## Related Issues/PRs

- Issue #133: Homepage SVG to images analysis
- Issue #134: Homepage improvements implementation
- PR #135: Implementation of homepage changes
- Containerized CI/CD strategy documentation

## Benefits Summary

1. **Cost**: Free alternative to Docker Desktop
2. **Performance**: Native virtualization, lower overhead
3. **Flexibility**: Full Ubuntu VM with SSH access
4. **Compatibility**: Works with existing Docker workflows
5. **Simplicity**: One-command setup

## Next Steps

1. Team members can use the setup script for quick installation
2. Consider adding Lima setup to developer onboarding docs
3. Test CI/CD Docker images locally using Lima
4. Explore using Lima for other development VMs

## Testing Status

✅ Lima VM successfully created and running
✅ Docker 28.3.0 installed and functional
✅ File sharing working between macOS and VM
✅ Port forwarding operational
✅ Docker Compose commands working
✅ Successfully tested with hello-world and alpine containers

This setup provides a production-ready Docker environment without the licensing concerns of Docker Desktop.