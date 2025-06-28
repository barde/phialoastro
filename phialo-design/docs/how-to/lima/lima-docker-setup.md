# Lima VM Setup with Docker on Ubuntu 24.04

This guide sets up Lima VM on macOS with Ubuntu 24.04 and Docker, using Apple's native Virtualization.framework for optimal performance.

## Prerequisites

- macOS 13 (Ventura) or newer (for Virtualization.framework support)
- Homebrew installed
- At least 8GB of RAM (4GB for VM)
- 20GB+ free disk space

## Step 1: Install Lima

```bash
# Install Lima via Homebrew
brew install lima

# Verify installation
limactl --version
```

## Step 2: Create Lima Configuration

Create a custom configuration file for Ubuntu with Docker:

```bash
mkdir -p ~/.lima
cat > ~/.lima/ubuntu-docker.yaml << 'EOF'
# Ubuntu 24.04 with Docker configuration
vmType: "vz"  # Use Apple Virtualization.framework
rosetta:
  enabled: true  # Enable Rosetta for x86_64 emulation on Apple Silicon
  binfmt: true

# VM Resources
cpus: 4
memory: "8GiB"
disk: "60GiB"

# Ubuntu 24.04 LTS images
images:
  - location: "https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img"
    arch: "x86_64"
  - location: "https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-arm64.img"
    arch: "aarch64"

# File sharing between macOS and VM
mounts:
  - location: "~"
    writable: true
    sshfs:
      cache: true
      followSymlinks: false
  - location: "/tmp/lima"
    writable: true

# Network configuration
networks:
  - lima: shared

# Port forwarding
portForwards:
  - guestSocket: "/run/user/{{.UID}}/docker.sock"
    hostSocket: "{{.Dir}}/sock/docker.sock"

# Provision script to install Docker
provision:
  - mode: system
    script: |
      #!/bin/bash
      set -eux -o pipefail
      
      # Update system
      apt-get update
      apt-get upgrade -y
      
      # Install prerequisites
      apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        build-essential \
        git
      
      # Add Docker's official GPG key
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      
      # Add Docker repository
      echo \
        "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
      
      # Install Docker
      apt-get update
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      
      # Enable Docker service
      systemctl enable docker
      systemctl start docker

  - mode: user
    script: |
      #!/bin/bash
      set -eux -o pipefail
      
      # Add user to docker group
      sudo usermod -aG docker $USER
      
      # Create docker socket directory
      mkdir -p "${HOME}/.lima/{{.Name}}/sock"
      
      # Configure Docker to use the socket
      sudo mkdir -p /etc/systemd/system/docker.service.d
      sudo tee /etc/systemd/system/docker.service.d/override.conf <<EOL
      [Service]
      ExecStart=
      ExecStart=/usr/bin/dockerd -H fd:// -H unix://${HOME}/.lima/{{.Name}}/sock/docker.sock
      EOL
      
      sudo systemctl daemon-reload
      sudo systemctl restart docker

# SSH configuration
ssh:
  loadDotSSHPubKeys: true

# Message shown after VM starts
message: |
  To use Docker from macOS:
  docker context create lima-ubuntu --docker "host=unix://{{.Dir}}/sock/docker.sock"
  docker context use lima-ubuntu
  
  Or set the DOCKER_HOST environment variable:
  export DOCKER_HOST="unix://{{.Dir}}/sock/docker.sock"
  
  To enter the VM:
  limactl shell ubuntu-docker
EOF
```

## Step 3: Start the Lima VM

```bash
# Create and start the VM
limactl create --name=ubuntu-docker ~/.lima/ubuntu-docker.yaml
limactl start ubuntu-docker

# Wait for provisioning to complete (this may take a few minutes)
# You can monitor progress with:
limactl show-ssh ubuntu-docker
```

## Step 4: Configure Docker on macOS

```bash
# Create Docker context
docker context create lima-ubuntu --docker "host=unix://${HOME}/.lima/ubuntu-docker/sock/docker.sock"

# Use the new context
docker context use lima-ubuntu

# Alternatively, set DOCKER_HOST environment variable
echo 'export DOCKER_HOST="unix://${HOME}/.lima/ubuntu-docker/sock/docker.sock"' >> ~/.zshrc
source ~/.zshrc
```

## Step 5: Verify Installation

```bash
# Check Docker version
docker version

# Run hello-world container
docker run hello-world

# Check Docker Compose
docker compose version

# Enter the VM if needed
limactl shell ubuntu-docker

# Inside VM, check Docker status
sudo systemctl status docker
docker ps
```

## Step 6: Set up Phialo Design Project

```bash
# Clone your project if not already done
cd ~/code/phialoastro/phialo-design

# Build Docker images
docker compose build

# Start development server
docker compose up dev

# Access at http://localhost:4321
```

## Useful Commands

### VM Management

```bash
# List VMs
limactl list

# Stop VM
limactl stop ubuntu-docker

# Start VM
limactl start ubuntu-docker

# Delete VM
limactl delete ubuntu-docker

# SSH into VM
limactl shell ubuntu-docker
```

### Docker Commands

```bash
# Run commands in VM
lima ubuntu-docker docker ps
lima ubuntu-docker docker images

# Or use docker directly from macOS
docker ps
docker images
```

### File Sharing

Your home directory is automatically mounted in the VM at the same path. For example:
- macOS: `~/code/project`
- VM: `~/code/project`

### Port Forwarding

Ports are automatically forwarded. If you run a service on port 8080 in the VM, it's accessible at `localhost:8080` on macOS.

## Performance Tips

1. **Use Virtualization.framework**: The `vmType: "vz"` setting uses Apple's native virtualization for better performance
2. **Enable Rosetta**: On Apple Silicon, this allows running x86_64 containers efficiently
3. **Allocate enough resources**: Give the VM at least 4 CPUs and 8GB RAM for Docker workloads
4. **Use virtiofs mounts**: Better performance than sshfs for file sharing

## Troubleshooting

### Docker socket not accessible

```bash
# Restart Docker in VM
limactl shell ubuntu-docker
sudo systemctl restart docker

# Check socket permissions
ls -la ~/.lima/ubuntu-docker/sock/
```

### VM fails to start

```bash
# Check logs
limactl show ubuntu-docker
cat ~/.lima/ubuntu-docker/serial.log

# Try with debug mode
limactl start ubuntu-docker --debug
```

### Slow file access

Consider using `mountType: "virtiofs"` in the mounts section for better performance.

### Permission issues

```bash
# Fix Docker permissions in VM
limactl shell ubuntu-docker
sudo usermod -aG docker $USER
newgrp docker
```

## Advantages over Docker Desktop

1. **Free and open source**: No licensing restrictions
2. **Lower resource usage**: More efficient than Docker Desktop
3. **Better macOS integration**: Uses native virtualization
4. **Flexibility**: Full Ubuntu VM with SSH access
5. **Multiple VMs**: Run different configurations simultaneously

## Next Steps

1. Install your Docker containers inside the VM
2. Set up development workflows using the mounted directories
3. Configure additional services in the Ubuntu VM as needed
4. Explore Lima's template system for quick VM creation

This setup provides a full Ubuntu 24.04 environment with Docker, accessible from your macOS terminal just like Docker Desktop, but with more control and flexibility.