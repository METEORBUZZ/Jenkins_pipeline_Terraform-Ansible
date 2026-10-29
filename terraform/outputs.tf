output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "Public IPv4 address of the provisioned web server"
  value       = aws_instance.web.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.web.public_dns
}

output "website_url" {
  description = "HTTP URL to access the deployed web page via Nginx reverse proxy (Port 80)"
  value       = "http://${aws_instance.web.public_ip}"
}

output "chat_app_direct_url" {
  description = "Direct Node.js WebSocket URL (Port 3000)"
  value       = "http://${aws_instance.web.public_ip}:3000"
}

output "ssh_command" {
  description = "Convenient command to SSH into the web server"
  value       = "ssh -i <your-private-key> ${var.ssh_user}@${aws_instance.web.public_ip}"
}

output "vpc_id" {
  description = "ID of the VPC created"
  value       = aws_vpc.main.id
}

output "security_group_id" {
  description = "ID of the security group attached"
  value       = aws_security_group.web_sg.id
}

