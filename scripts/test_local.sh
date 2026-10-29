#!/usr/bin/env bash
# ==============================================================================
# Local Validation & Dry-Run Script
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== [1/3] Validating Terraform Code ==="
cd "$ROOT_DIR/terraform"
if command -v terraform &> /dev/null; then
    terraform fmt -check || echo "Tip: Run 'terraform fmt' to auto-format"
    terraform init -backend=false
    terraform validate
    echo "✓ Terraform syntax and configurations are valid."
else
    echo "⚠️ Terraform binary not found locally. Skipping local terraform validation."
fi

echo ""
echo "=== [2/3] Validating Ansible Playbook Syntax ==="
cd "$ROOT_DIR/ansible"
if command -v ansible-playbook &> /dev/null; then
    ansible-playbook --syntax-check playbook.yml -i inventory/hosts.example
    echo "✓ Ansible playbook syntax is valid."
else
    echo "⚠️ Ansible binary not found locally. Skipping local ansible syntax check."
fi

echo ""
echo "=== [3/3] Checking Project Structure ==="
cd "$ROOT_DIR"
ls -la Jenkinsfile terraform/main.tf ansible/playbook.yml
echo "✓ Project structure check passed!"

