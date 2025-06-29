# Lima Docker Setup - Working Configuration

Your Lima VM with Docker is now successfully running! Here's how to use it:

## Quick Usage

### Run Docker commands through Lima:
```bash
limactl shell ubuntu-docker -- docker run --rm alpine echo "Hello from Docker!"
limactl shell ubuntu-docker -- docker ps
limactl shell ubuntu-docker -- docker images
```

### Create an alias for convenience:
Add this to your `~/.zshrc` or `~/.bashrc`:
```bash
alias docker="limactl shell ubuntu-docker -- docker"
alias docker-compose="limactl shell ubuntu-docker -- docker compose"
```

Then reload your shell:
```bash
source ~/.zshrc
```

### Enter the VM directly:
```bash
limactl shell ubuntu-docker
```

## VM Details

- **VM Name**: ubuntu-docker
- **OS**: Ubuntu 24.04 LTS
- **CPUs**: 4
- **Memory**: 8GB
- **Disk**: 60GB
- **Docker**: 28.3.0

## Using with Phialo Design Project

1. Navigate to your project:
```bash
cd ~/code/phialoastro/phialo-design
```

2. Build using Docker:
```bash
limactl shell ubuntu-docker -- docker compose build
```

3. Run development server:
```bash
limactl shell ubuntu-docker -- docker compose up dev
```

## VM Management

### Check VM status:
```bash
limactl list
```

### Stop the VM:
```bash
limactl stop ubuntu-docker
```

### Start the VM:
```bash
limactl start ubuntu-docker
```

### Delete the VM (if needed):
```bash
limactl delete ubuntu-docker
```

## File Sharing

Your home directory is automatically mounted in the VM at the same path:
- macOS: `~/code/project`
- VM: `~/code/project`

## Port Forwarding

Ports are automatically forwarded. Services running in the VM are accessible on localhost.

## Advantages over Docker Desktop

1. **Free and open source** - No licensing restrictions
2. **Lower resource usage** - More efficient than Docker Desktop
3. **Native virtualization** - Uses Apple's Virtualization.framework
4. **Full Ubuntu VM** - SSH access and complete control
5. **Multiple VMs** - Run different configurations simultaneously

## Troubleshooting

If Docker commands fail with permission errors:
```bash
# Restart the VM to apply group changes
limactl stop ubuntu-docker
limactl start ubuntu-docker
```

If you need to check Docker status:
```bash
limactl shell ubuntu-docker -- sudo systemctl status docker
```

## Next Steps

1. Set up the Docker alias in your shell profile
2. Try building the Phialo Design Docker containers
3. Run the development server with Docker Compose
4. Explore Lima's other features like multiple VM support

The Lima VM provides a lightweight, efficient alternative to Docker Desktop with full Ubuntu 24.04 and Docker support!