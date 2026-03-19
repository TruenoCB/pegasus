#!/bin/bash
set -e

echo "========================================"
echo "🚀 欢迎使用 PEGASUS 极客运维容器"
echo "========================================"

# 1. 环境初始化 (如果还未安装 Node 和 Nginx)
if ! command -v node &> /dev/null; then
    echo "📦 [1/4] 正在安装 Node.js 和 Nginx..."
    apt-get update -qq
    # 安装 curl, vim, nginx 等
    apt-get install -y -qq curl vim nano net-tools nginx > /dev/null
    
    # 安装 Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
    apt-get install -y -qq nodejs > /dev/null
    echo "✅ 环境安装完成 (Node: $(node -v), Go: $(go version | awk '{print $3}'))"
else
    echo "✅ [1/4] 基础环境已就绪"
fi

# 2. 编译前端 (检查如果还没编译过的话)
echo "🔨 [2/4] 检查前端构建..."
cd /app/frontend
if [ ! -d "dist" ]; then
    echo "   发现未编译的前端，开始编译..."
    npm install
    npm run build
    echo "✅ 前端编译完成"
else
    echo "   发现已编译的前端 dist 目录，跳过编译。(如需重新编译，请进容器执行 npm run build)"
fi

# 3. 编译并启动后端
echo "🔨 [3/4] 检查并编译后端..."
cd /app/backend
go mod download
go build -o api cmd/api/main.go
echo "✅ 后端编译完成"

# 4. 启动服务
echo "🚀 [4/4] 启动服务..."

# 启动 Nginx (后台运行)
# 配置文件已经在 docker-compose 中挂载到了 /etc/nginx/sites-available/default
service nginx start
echo "✅ Nginx 已启动"

# 启动后端 (前台运行，接管容器的主进程，这样可以在 NAS 控制台直接看日志)
echo "🟢 启动后端 API..."
exec ./api
