# --- 第一阶段：编译代码 ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# 国内虚拟机如果拉取慢，可以加上淘宝镜像源：RUN npm config set registry https://registry.npmmirror.com
RUN npm install
COPY . .
RUN npm run build

# --- 第二阶段：用 Nginx 运行 ---
FROM nginx:alpine
# 🌟 注意：Vue默认打包到 dist，React一般是 build，根据你的框架调整路径
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]