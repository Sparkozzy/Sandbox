FROM node:20-alpine

WORKDIR /app

# Instala dependências primeiro (cache layer)
COPY package.json ./
RUN npm install --omit=dev

# Copia o restante dos arquivos
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
