variable "aws_region" {
  description = "AWS region for provisioning resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix for tagging and resource naming"
  type        = string
  default     = "jenkins-tf-ansible"
}

variable "environment" {
  description = "Environment tier (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for the public subnet"
  type        = string
  default     = "us-east-1a"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "ssh_public_key" {
  description = "SSH public key content to inject into EC2 instance. If empty, public_key_path will be used."
  type        = string
  default     = ""
}

variable "public_key_path" {
  description = "Path to SSH public key file (used if ssh_public_key is not set)"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "ssh_user" {
  description = "Default SSH user for connecting via Ansible (Ubuntu uses 'ubuntu', Amazon Linux uses 'ec2-user')"
  type        = string
  default     = "ubuntu"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access (port 22)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_http_cidrs" {
  description = "CIDR blocks allowed for HTTP access (port 80)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ansible_inventory_path" {
  description = "Relative or absolute path where the generated Ansible inventory file will be saved"
  type        = string
  default     = "../ansible/inventory/hosts"
}

