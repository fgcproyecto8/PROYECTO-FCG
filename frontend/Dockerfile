# Etapa 1: compila la SPA de React con Vite. Usa frontend/.env.production
# (ya versionado, con VITE_API_URL=https://api.app6.academia.ar/api)
# para que el build quede apuntando a la API pública, no a localhost.
FROM node:22-alpine AS build

WORKDIR /app

# No hay package-lock.json en el repositorio (se usa `npm install`,
# no `npm ci`, que lo exige). Ver nota en el informe sobre agregar un
# lockfile para builds reproducibles.
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: sirve el build estático con Nginx.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
