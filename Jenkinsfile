pipeline {
    agent any

    environment {
        ANSIBLE_HOST_KEY_CHECKING = 'False'
        TF_IN_AUTOMATION          = 'true'
    }

    stages {
        // Stage 0: Pull latest code from GitHub
        stage('Git Checkout') {
            steps {
                checkout scm
            }
        }

        // Stage 1: Terraform Plan (Preview changes)
        stage('Stage 1 - Terraform Plan') {
            steps {
                dir('terraform') {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-credentials',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh 'terraform init'
                        sh 'terraform plan'
                    }
                }
            }
        }

        // Stage 2: Terraform Apply (Provision EC2 & generate inventory)
        stage('Stage 2 - Terraform Apply') {
            steps {
                dir('terraform') {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-credentials',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh 'terraform apply -auto-approve'
                    }
                }
            }
        }

        // Stage 3: Ansible Configure (Install & configure web application)
        stage('Stage 3 - Ansible Configure') {
            steps {
                dir('ansible') {
                    sshagent(['ec2-ssh-key']) {
                        // Wait 30 seconds for newly created EC2 instance to initialize SSH
                        sh 'sleep 30'
                        sh 'ansible-playbook -i inventory/hosts playbook.yml'
                    }
                }
            }
        }
    }

    post {
        success {
            echo "=========================================="
            echo " CI/CD Pipeline Completed Successfully!  "
            echo "=========================================="
        }
        failure {
            echo " Pipeline Failed. Check console output. "
        }
    }
}
