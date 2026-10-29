resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key != "" ? var.ssh_public_key : file(pathexpand(var.public_key_path))

  tags = {
    Name = "${var.project_name}-key"
  }
}

