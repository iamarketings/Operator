# Guide de Configuration du Serveur Asterisk 18 pour "Operator" (avec chan_sip)

Ce document détaille les étapes pour installer et configurer un serveur Asterisk 18 sur un VPS (Debian/Ubuntu) afin qu'il puisse être géré par le backend de l'application "Operator" en utilisant le module **chan_sip**.

L'architecture cible est :
- **Asterisk 18** : Le moteur de téléphonie (PBX).
- **MariaDB (MySQL)** : Pour la configuration persistante via l'architecture **Asterisk Realtime**.
- **AMI (Asterisk Manager Interface)** : Pour le pilotage et les événements en temps réel.

---

## 1. Prérequis

- Un VPS avec une installation fraîche de Debian 11/12 ou Ubuntu 20.04/22.04.
- Un accès root ou un utilisateur avec des privilèges `sudo`.
- Connaissances de base de la ligne de commande Linux.

---

## 2. Étape 1 : Préparation du Système

Mettez à jour votre système et installez les dépendances de base nécessaires à la compilation.

```bash
# Mettre à jour les paquets
sudo apt update && sudo apt upgrade -y

# Installer les dépendances pour la compilation d'Asterisk
sudo apt install -y build-essential git curl wget libnewt-dev libssl-dev \
libncurses5-dev subversion libsqlite3-dev libjansson-dev libxml2-dev \
uuid-dev libsrtp2-dev
```

---

## 3. Étape 2 : Installation et Configuration de MariaDB

Asterisk stockera sa configuration (postes, liaisons...) dans une base de données.

```bash
# Installer le serveur MariaDB
sudo apt install -y mariadb-server

# Lancer le script de sécurisation et suivre les instructions
# (Définir le mot de passe root, supprimer les utilisateurs anonymes, etc.)
sudo mysql_secure_installation
```

Créez ensuite la base de données et l'utilisateur pour Asterisk.

```bash
# Se connecter à MariaDB en tant que root
sudo mysql -u root -p

-- Créer la base de données
CREATE DATABASE asterisk;

-- Créer un utilisateur dédié (remplacez 'mot_de_passe_solide' par un vrai mot de passe)
CREATE USER 'asteriskuser'@'localhost' IDENTIFIED BY 'mot_de_passe_solide';

-- Donner les permissions à l'utilisateur sur la base de données
GRANT ALL PRIVILEGES ON asterisk.* TO 'asteriskuser'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Quitter
EXIT;
```

---

## 4. Étape 3 : Installation d'Asterisk 18

Nous compilons Asterisk depuis les sources pour avoir un contrôle total sur les modules.

```bash
cd /usr/src/

# Télécharger la dernière version d'Asterisk 18
sudo wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-18-current.tar.gz

# Extraire l'archive
sudo tar zxvf asterisk-18-current.tar.gz

# Se déplacer dans le répertoire des sources
cd asterisk-18.*/

# Lancer le script de configuration pour vérifier les dépendances
sudo ./configure
```

Maintenant, configurez les modules à compiler.

```bash
# Ouvrir le menu de sélection des modules
sudo make menuselect
```

Dans le menu, assurez-vous que les options suivantes sont configurées :
- **Activez** `Channel Drivers` -> `chan_sip`.
- **Désactivez** `Channel Drivers` -> `chan_pjsip` pour éviter les conflits.
- **Activez** `Resource Modules` -> `res_config_mysql` (pour la connexion à la BDD).
- Sous `Compiler Flags` -> `DONT_OPTIMIZE` (peut aider à éviter des problèmes sur certains VPS).

Sauvegardez (`Save & Exit`) puis compilez et installez.

```bash
# Lancer la compilation
sudo make

# Installer les binaires
sudo make install

# Installer les fichiers de configuration d'exemple
sudo make samples

# Installer le script d'init pour systemd
sudo make config

# Créer l'utilisateur et le groupe 'asterisk'
sudo groupadd asterisk
sudo useradd -r -d /var/lib/asterisk -g asterisk asterisk
sudo chown -R asterisk:asterisk /etc/asterisk /var/{lib,log,spool}/asterisk /usr/lib/asterisk
```

---

## 5. Étape 4 : Configuration d'Asterisk Realtime pour chan_sip

C'est l'étape clé qui connecte Asterisk à la base de données MariaDB.

**1. Configurer la connexion à la BDD (`res_config_mysql.conf`)**

Éditez `/etc/asterisk/res_config_mysql.conf` et ajoutez la connexion :
```ini
[asterisk]
dbhost = 127.0.0.1
dbname = asterisk
dbuser = asteriskuser
dbpass = mot_de_passe_solide
dbport = 3306
dbsock = /var/run/mysqld/mysqld.sock
```

**2. Configurer le chargement des données (`extconfig.conf`)**

Éditez `/etc/asterisk/extconfig.conf` pour dire à Asterisk de lire la configuration depuis la BDD.
```ini
[settings]
sipusers => mysql,asterisk,sip_users
queues => mysql,asterisk,queues
queue_members => mysql,asterisk,queue_members
```

**3. Créer les tables dans la BDD**

Le backend aura besoin de la table `sip_users` pour gérer les postes et liaisons SIP. Exécutez cette commande SQL dans votre base `asterisk`.

```sql
CREATE TABLE `sip_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `callerid` varchar(80) DEFAULT NULL,
  `defaultuser` varchar(80) NOT NULL,
  `secret` varchar(80) DEFAULT NULL,
  `context` varchar(80) DEFAULT NULL,
  `host` varchar(31) NOT NULL DEFAULT 'dynamic',
  `type` enum('friend','user','peer') NOT NULL DEFAULT 'friend',
  `disallow` varchar(100) DEFAULT 'all',
  `allow` varchar(100) DEFAULT 'alaw,ulaw,gsm',
  `qualify` char(3) DEFAULT 'yes',
  `nat` varchar(5) NOT NULL DEFAULT 'force_rport,comedia',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
*(Note : Les schémas pour les files d'attente peuvent être trouvés dans la documentation d'Asterisk. Ce schéma pour `sip_users` est un bon point de départ).*

---

## 6. Étape 5 : Configuration de l'AMI (Manager)

Le backend utilisera l'AMI pour les actions et événements en temps réel.

Éditez `/etc/asterisk/manager.conf`.
```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[operator_backend]
secret = un_autre_mot_de_passe_solide
deny = 0.0.0.0/0
permit = 127.0.0.1/255.255.255.0
permit = IP_DU_SERVEUR_BACKEND/255.255.255.255  ; <-- Très important pour la sécurité
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,command,agent,user,config,originate,message
```
**Important** : Remplacez `IP_DU_SERVEUR_BACKEND` par l'adresse IP publique de la machine qui hébergera votre backend Node.js.

---

## 7. Étape 6 : Sécurisation avec Fail2Ban

Protégez votre PBX contre les tentatives d'enregistrement frauduleuses.

```bash
# Installer Fail2Ban
sudo apt install -y fail2ban

# Créer un fichier de configuration local pour Asterisk
sudo nano /etc/fail2ban/jail.local
```

Ajoutez la section suivante à la fin de `jail.local` :
```ini
[asterisk]
enabled  = true
port     = 5060,5061
filter   = asterisk
logpath  = /var/log/asterisk/messages
maxretry = 5
bantime  = 86400 ; Banni pour 24h
```

```bash
# Redémarrer Fail2Ban pour appliquer la configuration
sudo systemctl restart fail2ban
```

---

## 8. Étape 7 : Démarrage et Vérification

Votre serveur est maintenant configuré.

```bash
# Démarrer Asterisk
sudo systemctl start asterisk

# Activer le démarrage automatique
sudo systemctl enable asterisk

# Se connecter à la console Asterisk pour vérifier
sudo asterisk -rvvv

# Dans la console Asterisk, tapez ces commandes pour vérifier
# que les modules sont bien chargés :
> module show like mysql
> module show like chan_sip
> sip show peers  ; (devrait être vide, mais la commande doit fonctionner)

# Pour quitter la console :
> exit
```

Votre serveur Asterisk est maintenant prêt. Le backend pourra se connecter à la base de données `asterisk` (via l'utilisateur `asteriskuser`) et à l'interface AMI (port 5038, utilisateur `operator_backend`) pour gérer le PBX.