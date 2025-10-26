# Operator - Une Interface Graphique Moderne pour Asterisk

**Operator** est un projet visant à fournir une interface web moderne, réactive et intuitive pour la gestion d'un autocommutateur (PBX) Asterisk 18. L'objectif est de remplacer les interfaces vieillissantes ou la gestion en ligne de commande par une expérience utilisateur centralisée et agréable.

- **Développeur principal :** Aheshman Itibar

## Table des matières

1.  [Philosophie du projet](#philosophie-du-projet)
2.  [Fonctionnalités Actuelles (Ce qui est fait)](#fonctionnalités-actuelles-ce-qui-est-fait)
3.  [Feuille de Route (Ce qui manque)](#feuille-de-route-ce-qui-manque)
4.  [Stack Technique](#stack-technique)
5.  [Structure du Projet](#structure-du-projet)

---

### Philosophie du projet

L'application est conçue comme un **frontend pur** et découplé. Elle communique avec Asterisk via un **backend/API** qui reste à développer. Cette approche "headless" permet :
- Une **sécurité accrue** : La logique métier et les identifiants de connexion à Asterisk (AMI, base de données) ne sont jamais exposés côté client.
- Une **flexibilité maximale** : Le backend peut être écrit dans n'importe quel langage (Node.js, Python, Go...) et peut évoluer indépendamment de l'interface.
- Une **expérience utilisateur riche** : Le frontend peut se concentrer sur l'ergonomie et la réactivité, sans être ralenti par la logique de communication directe avec Asterisk.

L'état actuel du projet est une **application cliente prête à consommer une API**. Elle tente d'appeler de vrais points d'accès (ex: `/api/extensions`) et se rabat sur des données simulées si le backend n'est pas disponible, permettant un développement et des tests en parallèle.

---

### Fonctionnalités Actuelles (Ce qui est fait)

L'interface utilisateur couvre déjà les principaux besoins de gestion d'un PBX :

#### ✅ **1. Tableau de Bord (Dashboard)**
- **Supervision en temps réel** des appels actifs.
- **Cartes de métriques** claires et cohérentes : appels en cours, postes connectés, liaisons actives, conférences.
- **Graphique d'activité** des appels pour visualiser les pics de charge.
- **État du système** : version d'Asterisk, uptime, charge CPU/mémoire (simulés).

#### ✅ **2. Gestion des Postes (Extensions)**
- **CRUD complet** : Créer, visualiser, modifier et supprimer des postes.
- **Formulaire de configuration avancé** en modal avec onglets :
    - **Général** : Numéro, nom, mot de passe, protocole (PJSIP/SIP).
    - **Messagerie Vocale** : Activation, PIN, notification par e-mail.
    - **Enregistrement des appels** : Activation sélective (entrants/sortants).
- **Recherche et filtrage** instantanés.

#### ✅ **3. Gestion des Liaisons Externes (Trunks)**
- **CRUD complet** pour les liaisons SIP, PJSIP et IAX2.
- Interface simple pour gérer les fournisseurs SIP et les interconnexions.

#### ✅ **4. Gestion des Files d'attente (Queues)**
- **CRUD complet** pour les files d'attente.
- **Configuration intuitive** : nom, stratégie d'appel (`ringall`, `roundrobin`, etc.).
- **Gestion des membres** : Ajout/retrait d'agents depuis la liste des postes existants.
- **Affichage clair** des agents connectés et des appels en attente par file.

#### ✅ **5. Historique des Appels (CDR)**
- **Visualisation** des enregistrements d'appels détaillés.
- **Recherche** simple par numéro ou nom.
- **Pagination fonctionnelle** pour naviguer facilement dans un grand volume d'enregistrements.
- **Actions sur les enregistrements** : Boutons fonctionnels pour **écouter** et **télécharger** les appels enregistrés.

#### ✅ **6. Expérience Utilisateur (UX)**
- **Système de notifications intégré** : Chaque action (création, modification, suppression) est confirmée par une notification visuelle non intrusive, offrant un feedback clair à l'utilisateur.
- **Interface entièrement responsive** et moderne, construite avec Tailwind CSS.

---

### Feuille de Route (Ce qui manque)

La priorité absolue est de développer le backend et de connecter le frontend existant.

#### 🔴 **1. Développement du Backend (Priorité #1)**
- **Créer une API RESTful (ou GraphQL)** : Définir les points de terminaison (`endpoints`) pour chaque fonctionnalité CRUD, comme spécifié dans `BACKEND_README.md`.
    - `GET /api/extensions`
    - `POST /api/extensions`
    - `PUT /api/extensions/:id`
    - `DELETE /api/extensions/:id`
    - ... et ainsi de suite pour les `trunks`, `queues`, `cdr`.
- **Choisir une technologie backend** : Node.js (Express, Fastify), Python (Flask, FastAPI), ou Go sont d'excellents choix pour un micro-service léger.

#### 🟡 **2. Connexion du Backend à Asterisk**
- **Interface AMI (Asterisk Manager Interface)** : Pour les données temps réel. Le backend devra se connecter à l'AMI pour écouter les événements (`Newchannel`, `Hangup`, `QueueCallerJoin`, `QueueCallerLeave`, etc.) et les pousser vers le frontend via WebSockets.
- **Connexion à la base de données (Asterisk Realtime)** : Pour la configuration persistante (postes, liaisons...). Le backend exécutera les requêtes SQL sur la base de données (ex: `asterisk.sip_users`) pour appliquer les changements demandés par l'interface.
- **Exécution de commandes** : Pour certaines actions, le backend devra pouvoir exécuter des commandes Asterisk (`asterisk -rx "..."`).

#### 🔵 **3. Améliorations Futures**
- **Authentification et Gestion des Rôles** : Mettre en place un système de **connexion sécurisé** (ex: JWT) et définir des **rôles utilisateurs** (Admin, Superviseur, Utilisateur simple).
- **Plan de numérotation visuel (Visual Dialplan)** : Un éditeur graphique pour gérer la logique de routage des appels.
- **Gestionnaire de conférences** : Interface pour créer et modérer des ponts de conférence.
- **Messagerie vocale visuelle** : Écouter et gérer les messages vocaux depuis l'interface.
- **Tests et Déploiement** : Mettre en place des tests unitaires/d'intégration et un pipeline de déploiement (ex: avec Docker).

---

### Stack Technique

- **Frontend** : React 19 (avec Hooks)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Icônes** : Lucide React
- **Graphiques** : Recharts

---

### Structure du Projet

```
/
├── components/         # Composants React réutilisables
│   ├── shared/         # Composants génériques (Modal, Notification...)
│   ├── ActiveCallsTable.tsx
│   ├── ... (et les autres pages)
├── contexts/           # Contexte React (ex: Notifications)
│   └── NotificationContext.tsx
├── hooks/              # Hooks React personnalisés
│   └── useAsteriskData.ts  # Tente de fetch l'API et utilise des données simulées en fallback
├── types.ts            # Définitions des types TypeScript
├── App.tsx             # Composant principal, gère la navigation et le layout
├── index.tsx           # Point d'entrée de l'application React
└── index.html          # Fichier HTML racine
```