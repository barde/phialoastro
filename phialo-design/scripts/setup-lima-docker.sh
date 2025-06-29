#!/bin/bash
# Lima Docker Setup Script for macOS
# Sets up Lima VM with Ubuntu 24.04 and Docker

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VM_NAME="ubuntu-docker"
VM_CPUS="${VM_CPUS:-4}"
VM_MEMORY="${VM_MEMORY:-8GiB}"
VM_DISK="${VM_DISK:-60GiB}"

echo -e "${GREEN}Lima Docker Setup Script${NC}"
echo "========================"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is for macOS only${NC}"
    exit 1
fi

# Check macOS version (need 13+ for Virtualization.framework)
MAC_VERSION=$(sw_vers -productVersion | cut -d. -f1)
if [[ $MAC_VERSION -lt 13 ]]; then
    echo -e "${YELLOW}Warning: macOS 13+ recommended for Virtualization.framework${NC}"
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}Error: Homebrew is not installed${NC}"
    echo "Install it from: https://brew.sh"
    exit 1
fi

# Install or update Lima
echo -e "${GREEN}Installing/updating Lima...${NC}"
if command -v lima &> /dev/null; then
    brew upgrade lima || true
else
    brew install lima
fi

# Check if Docker CLI is installed
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}Installing Docker CLI...${NC}"
    brew install docker
fi

# Check if VM already exists
if limactl list | grep -q "^${VM_NAME}"; then
    echo -e "${YELLOW}VM '${VM_NAME}' already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Stopping and deleting existing VM...${NC}"
        limactl stop ${VM_NAME} 2>/dev/null || true
        limactl delete ${VM_NAME}
    else
        echo "Exiting without changes"
        exit 0
    fi
fi

# Create Lima configuration
echo -e "${GREEN}Creating Lima configuration...${NC}"
mkdir -p ~/.lima

cat > ~/.lima/${VM_NAME}.yaml << EOF
# Ubuntu 24.04 with Docker configuration
vmType: "vz"  # Use Apple Virtualization.framework
rosetta:
  enabled: true  # Enable Rosetta for x86_64 emulation on Apple Silicon
  binfmt: true

# VM Resources
cpus: ${VM_CPUS}
memory: "${VM_MEMORY}"
disk: "${VM_DISK}"

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
  - location: "/tmp/lima"
    writable: true

# Network configuration
networks:
  - lima: shared

# Port forwarding for Docker socket
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
        git \
        vim \
        htop
      
      # Add Docker's official GPG key
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      
      # Add Docker repository
      echo \
        "deb [arch="\$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        "\$(. /etc/os-release && echo "\$VERSION_CODENAME")" stable" | \
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
      sudo usermod -aG docker \$USER
      
      # Configure Docker daemon to listen on both sockets
      sudo mkdir -p /etc/docker
      sudo tee /etc/docker/daemon.json <<EOL
      {
        "hosts": ["unix:///var/run/docker.sock", "unix://\${HOME}/.lima/{{.Name}}/sock/docker.sock"],
        "log-driver": "json-file",
        "log-opts": {
          "max-size": "10m",
          "max-file": "3"
        }
      }
      EOL
      
      # Create systemd override for Docker
      sudo mkdir -p /etc/systemd/system/docker.service.d
      sudo tee /etc/systemd/system/docker.service.d/override.conf <<EOL
      [Service]
      ExecStart=
      ExecStart=/usr/bin/dockerd
      EOL
      
      # Create socket directory
      mkdir -p "\${HOME}/.lima/{{.Name}}/sock"
      
      # Restart Docker
      sudo systemctl daemon-reload
      sudo systemctl restart docker

# SSH configuration
ssh:
  loadDotSSHPubKeys: true

# Message shown after VM starts
message: |
  To use Docker from macOS:
  docker context create lima-${VM_NAME} --docker "host=unix://{{.Dir}}/sock/docker.sock"
  docker context use lima-${VM_NAME}
  
  Or set the DOCKER_HOST environment variable:
  export DOCKER_HOST="unix://{{.Dir}}/sock/docker.sock"
  
  To enter the VM:
  limactl shell ${VM_NAME}
EOF

# Start the VM
echo -e "${GREEN}Starting Lima VM (this may take several minutes)...${NC}"
limactl start ${VM_NAME}

# Wait for Docker to be ready
echo -e "${GREEN}Waiting for Docker to be ready...${NC}"
for i in {1..30}; do
    if limactl shell ${VM_NAME} docker version &>/dev/null; then
        break
    fi
    echo -n "."
    sleep 2
done
echo

# Configure Docker context
echo -e "${GREEN}Configuring Docker context...${NC}"
SOCKET_PATH="${HOME}/.lima/${VM_NAME}/sock/docker.sock"

# Wait for socket to be created
for i in {1..10}; do
    if [[ -S "$SOCKET_PATH" ]]; then
        break
    fi
    echo "Waiting for Docker socket..."
    sleep 2
done

# Create and use Docker context
docker context create lima-${VM_NAME} --docker "host=unix://${SOCKET_PATH}" 2>/dev/null || true
docker context use lima-${VM_NAME}

# Test Docker
echo -e "${GREEN}Testing Docker installation...${NC}"
if docker run --rm hello-world; then
    echo -e "${GREEN}✓ Docker is working correctly!${NC}"
else
    echo -e "${RED}✗ Docker test failed${NC}"
    exit 1
fi

# Show VM info
echo
echo -e "${GREEN}Lima VM Setup Complete!${NC}"
echo "======================="
echo "VM Name: ${VM_NAME}"
echo "CPUs: ${VM_CPUS}"
echo "Memory: ${VM_MEMORY}"
echo "Disk: ${VM_DISK}"
echo
echo "Useful commands:"
echo "  Enter VM:        limactl shell ${VM_NAME}"
echo "  Stop VM:         limactl stop ${VM_NAME}"
echo "  Start VM:        limactl start ${VM_NAME}"
echo "  Delete VM:       limactl delete ${VM_NAME}"
echo "  VM Status:       limactl list"
echo
echo "Docker is configured to use the Lima VM."
echo "You can now use 'docker' commands as usual."
echo
echo "To make this permanent, add to your shell profile:"
echo "  export DOCKER_HOST=\"unix://${SOCKET_PATH}\""
echo
echo -e "${GREEN}Happy containerizing! 🐳${NC}"