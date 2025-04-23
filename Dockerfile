FROM node:18-slim AS prisma-builder

WORKDIR /app

# Copier les fichiers nécessaires pour Prisma
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer et générer Prisma
RUN npm install --no-fund --no-audit prisma @prisma/client
RUN npx prisma generate

# Étape 2: Application avec Bun
FROM oven/bun:latest

WORKDIR /app

# Installer Node.js moderne dans Bun
RUN apt-get update && apt-get install -y \
     curl \
     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
     && apt-get install -y nodejs \
     && apt-get clean \
     && rm -rf /var/lib/apt/lists/*

# Vérifier les versions
RUN node -v && bun -v

# Copier l'application
COPY . .
COPY --from=prisma-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prisma-builder /app/node_modules/prisma ./node_modules/prisma

# Installer les dépendances avec Bun
RUN bun install


# Exposer le port et définir l'environnement
EXPOSE 3000
ENV NODE_ENV=production

# Démarrer avec un script qui migre puis lance l'application
CMD ["sh", "-c", "bun src/index.ts"]