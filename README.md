# API fait avec Elysia pour le projet evift

## Prérequis

- Posséder node

- Posséder Bun. Pour ce faire executer dans votre terminal :

```bash
npm install -g bun
```

> Pour vérifier que l'installation a bien fonctionné, effectuer : bun -v

- Posséder Postgres. Installer Postgres et pgAdmin
  https://www.postgresql.org/download/
  https://www.pgadmin.org/download/

- Posséder MongoDB et MongoCompass (MongoCompass sera proposé lors de l'installation de Mongodb) https://www.mongodb.com/try/download/community

## Commencer

### Récupérer le projet

- Pour récupérer le projet, vous devez exécuter la commande :

```bash
git clone https://github.com/PaulDelamare/evift-api.git
```

- Puis pour rentrer dedans effectuer :

```bash
cd evift-api
```

### Créer le .env

- Récupérer le .env.exemple dans la racine du code et créer le fichier .env à la racine

- Passer dans le .env les informations nécessaire montrer dans le exemple à modifiant avec vos propres données

### Installer les dépendance

Pour le bon fonctionnement du projet il faut tout d'abord installer les dépendance de celui-ci et éviter les erreurs.
Pour ce faire executer :

```bash
bun install
```

### Créer la base de donnée

- Créer dans votre postgres via pgAdmin la base de donnée "evift"

- Créer dans votre MongoCompass la base de donnée "eviftMessage" et ajouté en première collection "messages"

- effectuer dans le terminal de commande dans le projet "evift-api" la commande

```bash
bun migrate
```

### Création des rôles

- Créer les roles pour le site. Pour se faire exécuter :

```bash
bun create-role
```

## Lancer le server

Et pour finir et lancer le server, il ne reste plus qu'à exécuter :

```bash
bun run dev
```

Le server se lancera sur http://localhost:<port du .env>/
