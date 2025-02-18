# Étape 1 : Construction
FROM oven/bun AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package.json bun.lockb ./

# Installer les dépendances de développement
RUN bun install

# Copier le reste du code source
COPY . .

# Générer le client Prisma
RUN bunx prisma generate

# Étape 2 : Exécution
FROM oven/bun AS runner

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder /app /app

# Installer uniquement les dépendances de production
RUN bun install --production

# Exposer le port de l'application
EXPOSE 3000

# Définir la variable d'environnement pour la production
ENV NODE_ENV=production

# Exécuter les migrations Prisma et démarrer l'application
CMD ["sh", "-c", "bun run migrate && bun src/index.ts"]
