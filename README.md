# evift-api

API réalisée avec [Elysia](https://elysiajs.com/) pour le projet **evift**.

---

## Sommaire

- [evift-api](#evift-api)
  - [Sommaire](#sommaire)
  - [Prérequis](#prérequis)
  - [Structure du projet](#structure-du-projet)
  - [Installation \& Démarrage](#installation--démarrage)
    - [1. Récupérer le projet](#1-récupérer-le-projet)
    - [2. Installer les dépendances](#2-installer-les-dépendances)
  - [Configuration de l'environnement](#configuration-de-lenvironnement)
  - [Base de données](#base-de-données)
    - [1. PostgreSQL](#1-postgresql)
    - [2. MongoDB](#2-mongodb)
    - [3. Appliquer les migrations](#3-appliquer-les-migrations)
  - [Commandes utiles](#commandes-utiles)
  - [Mise en production (Docker \& Portainer)](#mise-en-production-docker--portainer)
    - [1. Générer l'image Docker](#1-générer-limage-docker)
    - [2. Déployer via Portainer](#2-déployer-via-portainer)
  - [Maintenance \& Bonnes pratiques](#maintenance--bonnes-pratiques)
  - [Auteurs](#auteurs)

---

## Prérequis

- **Node.js** (v18.x recommandé, v9.8.1 utilisé initialement)
- **Bun** (v1.1.12 utilisé)
  ```bash
  npm install -g bun
  # Vérifier l'installation
  bun -v
  ```
- **PostgreSQL** (v16.3)
  - [Télécharger PostgreSQL](https://www.postgresql.org/download/)
  - [Télécharger pgAdmin](https://www.pgadmin.org/download/)
- **MongoDB** (Community Edition)
  - [Télécharger MongoDB](https://www.mongodb.com/try/download/community)
  - [MongoDB Compass](https://www.mongodb.com/products/compass)

---

## Structure du projet

```
evift-api/
│
├── src/                # Code source de l'API (routes, contrôleurs, services, middlewares)
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── ...
├── migrations/         # Scripts de migration de base de données
├── scripts/            # Scripts utilitaires (création de rôles, etc.)
├── .env.example        # Exemple de fichier d'environnement
├── .env                # Fichier d'environnement (à créer)
├── package.json        # Dépendances npm et scripts
├── bun.lockb           # Fichier de lock Bun
├── Dockerfile          # Fichier Docker pour la production
├── README.md           # Ce fichier
└── ...
```

---

## Installation & Démarrage

### 1. Récupérer le projet

```bash
git clone https://github.com/PaulDelamare/evift-api.git
cd evift-api
```

### 2. Installer les dépendances

```bash
bun install
```

---

## Configuration de l'environnement

1. Copier le fichier `.env.example` en `.env` à la racine du projet.
2. Renseigner les variables d'environnement avec vos propres informations (Postgres, MongoDB, etc.).

---

## Base de données

### 1. PostgreSQL

- Créer une base nommée `evift` via pgAdmin ou en ligne de commande.

### 2. MongoDB

- Créer une base nommée `eviftMessage` via MongoDB Compass.
- Ajouter une collection `messages`.

### 3. Appliquer les migrations

```bash
bun migrate
```

---

## Commandes utiles

- **Créer les rôles nécessaires** :
  ```bash
  bun create-role
  ```
- **Lancer le serveur en développement** :
  ```bash
  bun dev
  ```
  Le serveur sera accessible sur [http://localhost:/](http://localhost:/)

---

## Mise en production (Docker & Portainer)

### 1. Générer l'image Docker

Sur la machine de build (Linux recommandé) :

```bash
npm run docker:linux
npm run docker:tar
```

- `docker:linux` : construit l'image Docker pour Linux.
- `docker:tar` : exporte l'image Docker au format `.tar`.

### 2. Déployer via Portainer

1. Se connecter à Portainer sur le NAS où l'application est hébergée.
2. Uploader l'image `.tar` générée.
3. Mettre à jour la stack correspondante à l'API evift avec la nouvelle image.
4. Redémarrer la stack si nécessaire.

**Remarque** : Veillez à bien renseigner les variables d'environnement de production dans Portainer.

---

## Maintenance & Bonnes pratiques

- **Sécurité** : Ne jamais versionner le fichier `.env` contenant des secrets.
- **Mises à jour** : Garder les dépendances à jour (`bun upgrade`).
- **Sauvegardes** : Mettre en place des sauvegardes régulières des bases de données.
- **Logs** : Surveiller les logs applicatifs et systèmes.

---

## Auteurs

- Paul Delamare
- [Ajouter ici les autres contributeurs]

---

Pour toute question ou contribution, n'hésitez pas à ouvrir une issue ou une pull request sur le dépôt GitHub.
