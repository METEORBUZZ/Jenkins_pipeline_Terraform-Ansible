#!/usr/bin/env bash
# ==============================================================================
# Jenkins Controller Bootstrap Script
# Installs: Java 17 (OpenJDK), Jenkins, Terraform, Ansible, AWS CLI, Git, curl
# Target OS: Ubuntu 22.04 LTS / Debian
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting Jenkins & DevOps Toolchain Installation..."
echo "=========================================================="

sudo apt-get update -y
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    unzip \
    git \
    netcat \
    python3 \
    python3-pip \
    python3-venv

# ------------------------------------------------------------------------------
# 1. Install Java 17 (Required by modern Jenkins)
# ------------------------------------------------------------------------------
echo "--> Installing OpenJDK 17..."
sudo apt-get install -y openjdk-17-jdk openjdk-17-jre

# ------------------------------------------------------------------------------
# 2. Install Jenkins
# ------------------------------------------------------------------------------
echo "--> Adding Jenkins Debian repository..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /etc/apt/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y jenkins

sudo systemctl enable jenkins
sudo systemctl start jenkins

# ------------------------------------------------------------------------------
# 3. Install HashiCorp Terraform
# ------------------------------------------------------------------------------
echo "--> Installing Terraform..."
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg --yes
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update -y
sudo apt-get install -y terraform

# ------------------------------------------------------------------------------
# 4. Install Ansible
# ------------------------------------------------------------------------------
echo "--> Installing Ansible..."
sudo apt-add-repository --yes --update ppa:ansible/ansible
sudo apt-get install -y ansible

# ------------------------------------------------------------------------------
# 5. Install AWS CLI v2
# ------------------------------------------------------------------------------
echo "--> Installing AWS CLI v2..."
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -q /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install --update || true
rm -rf /tmp/awscliv2.zip /tmp/aws

# ------------------------------------------------------------------------------
# 6. Allow Jenkins User to Run Ansible & Terraform cleanly
# ------------------------------------------------------------------------------
sudo usermod -aG sudo jenkins || true

echo "=========================================================="
echo " Installation Complete!"
echo " Jenkins status: $(sudo systemctl is-active jenkins)"
echo " Initial Admin Password:"
echo " $(sudo cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || echo 'Run: sudo cat /var/lib/jenkins/secrets/initialAdminPassword')"
echo ""
echo " Required Jenkins Plugins to install:"
echo " - Git"
echo " - Terraform"
echo " - Ansible"
echo " - SSH Agent"
echo " - Pipeline"
echo " - Credentials Binding"
echo " - AnsiColor"
echo "=========================================================="

