# Stage 1: Build the React (Vite) admin app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.admin.conf /etc/nginx/nginx.conf

# Fix permissions for Nginx temp/cache
RUN mkdir -p /var/cache/nginx && chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

USER nginx
CMD ["nginx", "-g", "daemon off;"]
