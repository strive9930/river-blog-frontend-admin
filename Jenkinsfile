pipeline {
    agent any

    environment {
        IMAGE_NAME = "ghcr.io/strive9930/riverli-blog-web"
        IMAGE_TAG = "v${BUILD_NUMBER}"
        MANIFEST_REPO = "github.com/strive9930/riverli-k8s-manifests.git"
    }

    stages {
        stage('📥 1. 检出代码') {
            steps {
                echo "开始构建前端项目: ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('📦 2. 构建并推送 Nginx 镜像') {
            steps {
                script {
                    // 借用宿主机的 Docker 引擎打包
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                    sh "docker build -t ${IMAGE_NAME}:latest ."

                    // 登录并推送到 GitHub 镜像仓库 (复用你之前配置好的凭据 ID)
                    withCredentials([usernamePassword(credentialsId: 'github-registry-credentials', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                        sh 'echo $REG_PASS | docker login ghcr.io -u $REG_USER --password-stdin'
                        sh 'docker push $IMAGE_NAME:$IMAGE_TAG'
                        sh 'docker push $IMAGE_NAME:latest'
                    }
                }
            }
        }

        stage('🔄 3. 改写 K8s 配置库') {
            steps {
                script {
                    sh 'rm -rf manifest-folder'
                    // 克隆你的配置库 (复用你之前配置好的凭据 ID)
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        sh 'git clone https://$GITHUB_TOKEN@$MANIFEST_REPO manifest-folder'
                    }

                    dir('manifest-folder') {
                        // 🌟 精准改写前端编排文件 apps/web.yaml 中的镜像版本号
                        sh "sed -i 's|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${IMAGE_TAG}|g' apps/web.yaml"

                        sh "git config user.name 'Jenkins CI'"
                        sh "git config user.email 'jenkins@riverli.com'"
                        sh "git add apps/web.yaml"
                        sh "git commit -m '🤖 Jenkins 自动发布前端: ${IMAGE_NAME}:${IMAGE_TAG}'"

                        withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                            sh 'git push https://$GITHUB_TOKEN@$MANIFEST_REPO main'
                        }
                    }
                }
            }
        }
    }
}