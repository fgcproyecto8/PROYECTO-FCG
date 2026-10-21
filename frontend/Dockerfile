# Etapa 1: compila la SPA con Vite. `npm run build` usa
# frontend/.env.production, así que el build apunta a
# https://api.app6.academia.ar/api. Vite 8 requiere Node 20.19+ o 22.12+.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: sirve el build estático con Nginx.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
