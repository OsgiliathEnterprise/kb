---

sidebar_position: 3
title: "Environment Setup"

---


# Environment Setup

Configure your local development environment for Osgiliath Enterprise projects.

## System Requirements

- **OS**: Linux (Ubuntu 22.04+), macOS 13+, or Windows with WSL2
- **Node.js**: 20 LTS or later
- **Docker**: 24+ with Compose
- **Git**: 2.40+

## Core Tools

### Node.js & npm

```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Docker

```bash
# Verify installation
docker --version
docker compose version
```

### Git Configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "you@osgiliath.enterprise"
```

## Project-Specific Setup

Each project may have additional requirements. Check the `README.md` in each repository for specific instructions.

## Verifying Your Setup

```bash
# Run the health check
npm run healthcheck

# Expected output:
# ✓ Node.js version OK
# ✓ Docker daemon running
# ✓ Git configured
# ✓ All dependencies satisfied
```

## Troubleshooting

If you encounter issues, refer to the [Troubleshooting Runbook](/docs/runbooks/troubleshooting).
