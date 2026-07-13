# --- 第一阶段：编译代码（把 18 升到 20 🌟） ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# 如果国内虚拟机下载慢，可以解开下面这行的注释使用淘宝镜像源：
# RUN npm config set registry https://registry.npmmirror.com
RUN npm install
COPY . .
RUN npm run build

# --- 第二阶段：用 Nginx 运行 ---
FROM nginx:alpine
# 注意：Vue默认打包到 dist，React一般是 build，根据你的实际框架调整
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]