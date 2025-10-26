# Guide de Développement Backend pour "Operator"

Ce document est la spécification technique et la feuille de route pour la création du backend de l'application **Operator**. Le frontend est terminé et prêt à consommer une API. La mission de ce backend est de fournir les données et d'exécuter les actions demandées en communiquant avec un PBX Asterisk 18 utilisant le module `chan_sip`.

## 1. Philosophie et Architecture

Le backend agit comme une **API middleware** entre le frontend React et le serveur Asterisk. Pour la phase de test initiale, nous omettons l'authentification pour un accès direct.

L'architecture s'appuie sur deux modes de communication principaux avec Asterisk :

1.  **Interface de gestion (AMI)** : Pour les **événements temps réel** (statut des postes, appels entrants/sortants, etc.) et pour exécuter des **commandes** (raccrocher, transférer).
2.  **Base de données (Architecture "Realtime")** : Pour la **configuration persistante** (CRUD des postes, liaisons, files d'attente). C'est la méthode moderne et recommandée pour gérer la configuration d'Asterisk.

Le backend exposera :
- Une **API RESTful** pour les opérations CRUD.
- Un **serveur WebSocket** pour pousser les événements temps réel vers le frontend.

## 2. Stack Technique Recommandée

-   **Langage** : **TypeScript** (pour la robustesse et la maintenabilité).
-   **Framework Node.js** : **Fastify** ou **Express**. Fastify est recommandé pour ses performances supérieures et sa validation de schémas intégrée.
-   **Communication AMI** : `asterisk-manager` ou une librairie similaire maintenue.
-   **Communication Base de Données** : Un driver SQL (`mysql2`, `pg`) et optionnellement un ORM comme **Prisma** ou **TypeORM** pour simplifier les requêtes.
-   **WebSockets** : `socket.io` ou `ws`. `socket.io` est plus complet et gère la reconnexion automatiquement.

## 3. Spécification de l'API RESTful

Le backend doit implémenter les points d'accès suivants.

---
### 3.1. Postes (`/api/extensions`)

-   `GET /` : Récupérer la liste de tous les postes.
-   `POST /` : Créer un nouveau poste.
    -   **Body** : `Omit<Extension, 'id' | 'status' | 'ipAddress' | 'userAgent'>`
    -   **Action** : Insérer un nouvel enregistrement dans la table `sip_users` (ou la table que vous avez configurée pour `chan_sip` en Realtime).
-   `PUT /:id` : Mettre à jour un poste existant.
    -   **Body** : `Extension`
    -   **Action** : Mettre à jour l'enregistrement correspondant dans la table `sip_users`.
-   `DELETE /:id` : Supprimer un poste.
    -   **Action** : Supprimer l'enregistrement de la table `sip_users`.

---
### 3.2. Liaisons Externes (`/api/trunks`)

-   `GET /` : Récupérer la liste de toutes les liaisons.
-   `POST /` : Créer une nouvelle liaison.
    -   **Body** : `Omit<Trunk, 'id' | 'status'>`
    -   **Action** : Insérer un enregistrement dans la table `sip_users` (souvent de `type=peer`) ou une table dédiée si configurée.
-   `PUT /:id` : Mettre à jour une liaison.
    -   **Body** : `Trunk`
-   `DELETE /:id` : Supprimer une liaison.

---
### 3.3. Files d'attente (`/api/queues`)

-   `GET /` : Récupérer la liste de toutes les files.
-   `POST /` : Créer une nouvelle file.
    -   **Body** : `Omit<Queue, 'id' | 'waitingCalls'>`
    -   **Action** : Insérer dans `queues` et `queue_members`.
-   `PUT /:id` : Mettre à jour une file.
    -   **Body** : `Queue`
-   `DELETE /:id` : Supprimer une file.

---
### 3.4. Historique des Appels (`/api/cdr`)

-   `GET /` : Récupérer les enregistrements CDR.
    -   **Query Params** : `?page=1&limit=15&search=...&startDate=...&endDate=...`
    -   **Action** : Interroger la table `cdr` avec filtres et pagination.

---
### 3.5. Actions sur les Appels (`/api/calls`)

-   `POST /hangup`
    -   **Body** : `{ "channel": "SIP/1001-..." }`
    -   **Action** : Exécuter la commande AMI `Hangup`.
-   `POST /transfer`
    -   **Body** : `{ "channel": "...", "destination": "1002" }`
    -   **Action** : Exécuter la commande AMI `Redirect`.

## 4. Spécification des Événements WebSocket

Le serveur WebSocket doit écouter les événements AMI et les retransmettre aux clients connectés sous un format standardisé.

-   **Événement** : `stats:update`
    -   **Payload** : `{ activeCalls: 5, registeredExtensions: 18, registeredTrunks: 2 }`
    -   **Déclenché par** : Tâche périodique (toutes les 2-3 secondes) qui agrège les statuts.

-   **Événement** : `call:new`
    -   **Payload** : Objet `Call` complet.
    -   **Déclenché par** : Événement AMI `Newchannel`.

-   **Événement** : `call:state-change`
    -   **Payload** : `{ id: "...", state: "Up" }`
    -   **Déclenché par** : Événement AMI `Newstate`.

-   **Événement** : `call:hangup`
    -   **Payload** : `{ id: "..." }` ou `{ channel: "..." }`
    -   **Déclenché par** : Événement AMI `Hangup`.

-   **Événement** : `peer:status`
    -   **Payload** : `{ type: 'extension' | 'trunk', id: "...", status: 'Registered' | 'Unregistered' | ... }`
    -   **Déclenché par** : Événement AMI `PeerStatus`.

## 5. Plan d'action Étape par Étape

1.  **Initialisation du Projet** :
    -   `npm init -y`
    -   Installer TypeScript, Fastify/Express, et les dépendances listées ci-dessus.
    -   Configurer un script de build et de démarrage (`nodemon` pour le développement).

2.  **Mise en place des Connexions** :
    -   Créer un module `ami.ts` pour initialiser et gérer la connexion à l'AMI.
    -   Créer un module `database.ts` pour initialiser la connexion à la base de données Asterisk.
    -   Utiliser un fichier `.env` pour stocker toutes les informations de connexion.

3.  **Construire les Endpoints CRUD** :
    -   Commencer par une ressource, par exemple les **Postes**.
    -   Créer le routeur pour `/api/extensions`.
    -   Implémenter les fonctions `GET`, `POST`, `PUT`, `DELETE`, en les faisant correspondre à des requêtes SQL sur la table `sip_users`.
    -   Répéter pour les **Liaisons**, **Files d'attente** et **CDR**.

4.  **Développer le Serveur WebSocket** :
    -   Initialiser `socket.io` et l'attacher au serveur HTTP.
    -   Dans le module `ami.ts`, écouter les événements pertinents (`Newchannel`, `Hangup`, `PeerStatus`, etc.).
    -   Lorsque'un événement AMI est reçu, le reformater selon la spécification ci-dessus et l'émettre (`io.emit(...)`) à tous les clients connectés.

5.  **Finaliser et Tester** :
    -   Mettre en place une gestion d'erreurs robuste.
    -   Ajouter du logging (`pino` est un excellent choix pour Fastify).
    -   Tester chaque endpoint et chaque événement WebSocket avec un client comme Postman ou Insomnia, et en connectant le frontend "Operator".

Ce guide fournit une base solide pour construire un backend performant et fiable. Bonne chance !