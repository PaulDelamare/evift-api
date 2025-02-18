FROM oven/bun

WORKDIR /app

COPY package.json .  
COPY bun.lockb .  

RUN bun install --production  

COPY src src  
COPY tsconfig.json .  
# COPY public public  

ENV NODE_ENV production  

# Exécuter la migration avant de lancer l'application
CMD ["sh", "-c", "bun migrate && bun src/index.ts"]

EXPOSE 3000
