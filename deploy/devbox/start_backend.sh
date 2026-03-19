#!/bin/bash
# ==========================================
# PEGASUS 后端启动与环境变量配置脚本
# 运行此脚本以注入环境变量并启动后端
# ==========================================

echo "⚙️ 正在加载环境变量..."

# 1. 数据库与中间件连接 (根据你的网络配置修改)
export DATABASE_URL="pegasus:pegasus_password@tcp(pegasus-mysql:3306)/pegasus?charset=utf8mb4&parseTime=True&loc=Local"
export REDIS_URL="pegasus-redis:6379"
export ELASTICSEARCH_URL="http://pegasus-es:9200"

# 2. 基础应用配置
export PORT="8080"
export JWT_SECRET="your_super_secret_production_key_12345"

# 3. AI 服务对接配置
export AI_PROVIDER="openai"
export AI_BASE_URL="https://api.openai.com/v1"
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export AI_MODEL="gpt-3.5-turbo"

# 4. 邮件推送服务配置
export SMTP_HOST="smtp.qq.com"
export SMTP_PORT="465"
export SMTP_USERNAME="your_email@qq.com"
export SMTP_PASSWORD="your_email_auth_code_here"

echo "✅ 环境变量加载完成"
echo "🚀 正在启动 PEGASUS 后端服务..."

# 进入后端目录并启动 (假设你已经 go build 出了 api 二进制文件)
cd /app/backend

if [ -f "./api" ]; then
    # 直接运行，日志会输出到当前控制台
    ./api
else
    echo "❌ 错误: 找不到 ./api 文件。请先执行 go build -o api cmd/api/main.go 进行编译！"
    exit 1
fi
