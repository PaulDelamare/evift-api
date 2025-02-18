# Étape 1 : Construction
FROM oven/bun AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package.json bun.lockb ./

# Installer toutes les dépendances (développement + production)
RUN bun install

# Copier le reste du code source
COPY . .

# Générer le client Prisma
RUN bunx prisma generate

# Étape 2 : Exécution
FROM oven/bun AS runner

# Définir le répertoire de travail
WORKDIR /app

# Copier l'intégralité de l'application depuis le builder (y compris node_modules)
COPY --from=builder /app /app

# Exposer le port de l'application
EXPOSE 3000

# Définir la variable d'environnement pour la production
ENV NODE_ENV=production

# Exécuter les migrations Prisma et démarrer l'application
CMD ["sh", "-c", "bun src/index.ts"]
