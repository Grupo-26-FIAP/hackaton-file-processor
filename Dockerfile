# Etapa de build
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Instalar dependências do sistema e FFmpeg
RUN apk add --no-cache ffmpeg bash

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante do código
COPY . .

# Construir a aplicação
RUN npm run build

# Configurar o ambiente de produção
ENV NODE_ENV=production

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Etapa de produção
FROM node:22-alpine AS production

WORKDIR /usr/src/app

RUN apk add --no-cache ffmpeg bash

# Copiar dependências e código construído da etapa anterior
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Configurar o usuário não root
USER node

# Comando para iniciar a aplicação
CMD [ "node", "dist/main.js" ]