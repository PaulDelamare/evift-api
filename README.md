# API fait avec Elysia pour le projet evift

## Prérequis

- Posséder node (version 9.8.1 utilisé dasn ce projet)

- Posséder Bun (version 1.1.12 utilisé pour ce projet). Pour ce faire exécuter dans votre terminal :

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

- Passer dans le .env les informations nécessaires montrer dans l'exemple à modifiant avec vos propres données

### Installer les dépendances

Pour le bon fonctionnement du projet, il faut tout d'abord installer les dépendances de celui-ci et éviter les erreurs.
Pour ce faire exécuter :

```bash
bun install
```

### Créer la base de données

- Créer dans votre postgres via pgAdmin la base de données "evift"

- Créer dans votre MongoCompass la base de données "eviftMessage" et ajouté en première collection "messages"

- Mettez dans le.env les informations liées à votre base

- effectuer dans le terminal de commande dans le projet "evift-api" la commande

```bash
bun migrate
```

### Création des rôles

- Créer les rôles pour le site. Pour se faire exécuter :

```bash
bun create-role
```

## Lancer le serveur

Et pour finir et lancer le serveur, il ne reste plus qu'à exécuter :

```bash
bun dev
```

Le serveur se lancera sur http://localhost:/
