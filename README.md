# ⬡ XAUUSD Algo Robot — Portfolio Project

> Robot de trading algorithmique sur l'Or (XAU/USD) avec dashboard web complet, système d'authentification JWT, gestion des dépôts/retraits, programme referral et panneau d'administration.

---

## 📋 Table des matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Fonctionnalités](#-fonctionnalités)
3. [Stack technique](#-stack-technique)
4. [Architecture du projet](#-architecture-du-projet)
5. [Robots de trading (MQL5 / MQL4)](#-robots-de-trading-mql5--mql4)
6. [Démarrage rapide](#-démarrage-rapide)
7. [Lancement en développement local](#-lancement-en-développement-local)
8. [Lancement avec Docker Compose](#-lancement-avec-docker-compose)
9. [Variables d'environnement](#-variables-denvironnement)
10. [API REST — Endpoints](#-api-rest--endpoints)
11. [Base de données — Modèles Prisma](#-base-de-données--modèles-prisma)
12. [Pages du site](#-pages-du-site)
13. [Administration & Accès DB](#-administration--accès-db)
14. [Compte par défaut](#-compte-par-défaut)
15. [Auteur](#-auteur)

---

## 🌐 Vue d'ensemble

Ce projet est un **portfolio complet** combinant :

- Un **Expert Advisor (EA)** MetaTrader 5 & MetaTrader 4 pour trader automatiquement l'or (XAU/USD)
- Un **dashboard web** pour visualiser les performances du robot en temps réel
- Un **backend REST** sécurisé (JWT) avec base de données PostgreSQL
- Un **frontend React** moderne avec interface sombre professionnelle

Le robot utilise une stratégie multi-timeframe (H1 / M15 / M5) basée sur la structure de marché (BOS), des EMA, du RSI et de l'ATR, avec filtres de sessions et de news.

---

## ✨ Fonctionnalités

### 🤖 Robot de trading
- Stratégie BOS (Break of Structure) + retest sur M5
- EMA 50 / 200 pour le biais directionnel sur H1
- RSI 14 pour la confirmation d'entrée
- ATR 14 pour le calcul dynamique des SL/TP
- Filtre de sessions : Londres + New York uniquement
- Filtre de news intégré (MT5 Calendar API / manuel sur MT4)
- Break-even et trailing stop automatiques
- Maximum 2 trades simultanés
- Calcul du lot par % de risque sur le capital
- Dashboard visuel dans MetaTrader (Comment overlay)

### 🖥️ Dashboard Web
- **Graphique d'équité** sur 5 ans (Chart.js)
- **Winrate par mois** (bar chart)
- **Statistiques globales** : profit net, drawdown, nb de trades, winrate
- **Tableau des trades** paginé avec filtres BUY/SELL/OPEN/CLOSED

### 👤 Authentification
- Login JWT (7 jours d'expiration)
- Protection de toutes les routes privées
- Déconnexion + redirection automatique sur token expiré

### 💰 Gestion financière
- **Dépôts** : virement bancaire, USDT (TRC20), Bitcoin, carte
- **Retraits** : virement bancaire, USDT, Bitcoin (minimum $50)
- Suivi des statuts (PENDING → CONFIRMED / COMPLETED / REJECTED)
- Historique complet par utilisateur

### 🤝 Programme Referral
- Code de parrainage unique par utilisateur
- Lien d'invitation copiable en un clic
- Tableau des filleuls avec commissions (10%)

### ⚙️ Administration
- Création, modification et suppression de comptes utilisateurs
- Changement de mots de passe
- Accès direct à Prisma Studio (interface DB visuelle)

---

## 🛠 Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router 6 |
| **Graphiques** | Chart.js 4 + react-chartjs-2 |
| **HTTP client** | Axios |
| **Backend** | Node.js 24, Express 4 |
| **ORM** | Prisma 5 |
| **Base de données** | PostgreSQL 16 |
| **Authentification** | JWT (jsonwebtoken) + bcryptjs |
| **Dev tools** | nodemon, Prisma Studio |
| **Containerisation** | Docker, Docker Compose |
| **Reverse proxy** | nginx (production) |
| **EA MetaTrader 5** | MQL5 — 883 lignes |
| **EA MetaTrader 4** | MQL4 — 688 lignes |

---

## 📁 Architecture du projet

```
holbertonschool-portfolio/
│
├── TUTO BOT/
│   ├── XAUUSD_Algo_Robot.mq5     # Expert Advisor MetaTrader 5 (883 lignes)
│   ├── XAUUSD_Algo_Robot.mq4     # Expert Advisor MetaTrader 4 (688 lignes)
│   └── TUTORIAL.md               # Guide complet d'utilisation (12 sections)
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── depositsController.js
│   │   │   ├── referralController.js
│   │   │   ├── statsController.js
│   │   │   ├── tradesController.js
│   │   │   ├── usersController.js
│   │   │   └── withdrawalsController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # Vérification JWT Bearer
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── deposits.js
│   │   │   ├── referral.js
│   │   │   ├── stats.js
│   │   │   ├── trades.js
│   │   │   ├── users.js
│   │   │   └── withdrawals.js
│   │   ├── prisma.js              # Instance singleton Prisma Client
│   │   └── index.js               # Serveur Express — point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma          # Définition des modèles DB
│   │   └── seed.js                # Données de démo (700 trades, 5 ans + admin)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js          # Axios + intercepteurs JWT auto
│   │   │   ├── stats.js
│   │   │   └── trades.js
│   │   ├── components/
│   │   │   ├── EquityChart.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── MonthlyBarChart.jsx
│   │   │   ├── Navbar.jsx         # Menu responsive avec hamburger mobile
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── WinrateChart.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Contexte auth global (localStorage)
│   │   ├── pages/
│   │   │   ├── AdminUsers.jsx     # Gestion des comptes utilisateurs
│   │   │   ├── Dashboard.jsx      # Graphiques de performance
│   │   │   ├── Deposits.jsx       # Formulaire + historique des dépôts
│   │   │   ├── Home.jsx           # Page d'accueil publique
│   │   │   ├── Login.jsx          # Formulaire de connexion
│   │   │   ├── Referral.jsx       # Programme de parrainage
│   │   │   ├── Trades.jsx         # Tableau paginé des trades
│   │   │   └── Withdrawals.jsx    # Formulaire + historique des retraits
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🤖 Robots de trading (MQL5 / MQL4)

### Stratégie

| Composant | Détail |
|-----------|--------|
| **Timeframe d'entrée** | M5 |
| **Timeframe de biais** | H1 (EMA 50 / 200) |
| **Indicateurs** | EMA 50, EMA 200, RSI 14, ATR 14 |
| **Signal** | BOS (Break of Structure) + retest de la zone cassée |
| **Filtre de sessions** | Londres (07h–16h GMT) + New York (12h–21h GMT) |
| **Filtre de news** | MT5 : Calendar API automatique / MT4 : créneaux manuels |
| **Risk management** | Lot calculé par % du capital, SL/TP basés sur ATR |
| **Max positions** | 2 simultanées |
| **Break-even** | Automatique au seuil configurable |
| **Trailing stop** | Activé après seuil ATR configurable |

### Paramètres principaux

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `RiskPercent` | `1.0` | % du capital risqué par trade |
| `ATR_SL_Mult` | `1.5` | Multiplicateur ATR pour le Stop Loss |
| `ATR_TP_Mult` | `3.0` | Multiplicateur ATR pour le Take Profit |
| `MaxSpread` | `25` | Spread maximum autorisé (points) |
| `MaxDrawdown` | `10.0` | Drawdown maximum (%) avant mise en pause |
| `TrailATR_Mult` | `1.0` | Multiplicateur ATR pour le trailing stop |
| `EnableNewsFilter` | `true` | Activer le filtre de news |
| `EnableLondonSession` | `true` | Trader pendant Londres |
| `EnableNewYorkSession` | `true` | Trader pendant New York |

> Voir [`TUTO BOT/TUTORIAL.md`](TUTO%20BOT/TUTORIAL.md) pour le guide complet d'utilisation, de backtesting et d'optimisation.

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- [Docker](https://www.docker.com/) (pour la base de données)
- [Git](https://git-scm.com/)

### Cloner le projet

```bash
git clone https://github.com/zoulouhh/holbertonschool-portfolio.git
cd holbertonschool-portfolio
```

---

## 💻 Lancement en développement local

### 1. Démarrer PostgreSQL via Docker

```bash
docker run -d \
  --name xauusd_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=xauusd_robot \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Configurer et démarrer le backend

```bash
cd backend

# Créer le fichier .env
cp .env.example .env
# ↑ Éditez .env pour adapter JWT_SECRET en production

# Installer les dépendances
npm install

# Créer les tables en base de données
npx prisma migrate dev --name init

# Injecter les données de démo (700 trades + compte admin)
node prisma/seed.js

# Démarrer le serveur (port 3001)
npm run dev
```

### 3. Démarrer le frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Démarrer Vite avec proxy vers le backend (port 5173)
npm run dev
```

### 4. Accéder au site

| Service | URL |
|---------|-----|
| 🌐 Site web | http://localhost:5173 |
| ⚙️ API backend | http://localhost:3001 |
| 🗄️ Prisma Studio | http://localhost:5555 |

### 5. (Optionnel) Ouvrir Prisma Studio

```bash
cd backend
npx prisma studio
# Disponible sur http://localhost:5555
```

---

## 🐳 Lancement avec Docker Compose

Pour déployer l'ensemble en une commande (PostgreSQL + Backend + Frontend nginx) :

```bash
# Depuis la racine du projet
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (nginx) | http://localhost |
| Backend API | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

```bash
# Arrêter les services
docker compose down

# Arrêter et supprimer les données
docker compose down -v
```

---

## 🔧 Variables d'environnement

### `backend/.env`

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/xauusd_robot"

# Serveur Express
PORT=3001

# CORS — URL autorisée du frontend
FRONTEND_URL=http://localhost:5173

# JWT — ⚠️ À changer absolument en production !
JWT_SECRET=changez_ce_secret_en_production_avec_une_valeur_longue_et_aleatoire
JWT_EXPIRES_IN=7d
```

> ⚠️ **Sécurité** : Ne committez jamais votre `JWT_SECRET` en production. Utilisez une valeur aléatoire d'au moins 32 caractères.  
> Génération : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📡 API REST — Endpoints

### Authentification — public

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/login` | Connexion → retourne `{ token, username }` |
| `GET` | `/api/auth/me` | Infos de l'utilisateur connecté |
| `GET` | `/api/health` | Statut du serveur |

### Trades — 🔒 JWT requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/trades` | Liste paginée (`?page`, `?limit`, `?type`, `?status`) |
| `GET` | `/api/trades/:id` | Détail d'un trade |
| `POST` | `/api/trades` | Créer un trade |
| `PUT` | `/api/trades/:id` | Modifier un trade |
| `DELETE` | `/api/trades/:id` | Supprimer un trade |

### Statistiques — 🔒 JWT requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/stats` | Statistiques globales + historique d'équité quotidien |

### Dépôts — 🔒 JWT requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/deposits` | Liste des dépôts de l'utilisateur connecté |
| `POST` | `/api/deposits` | Soumettre une demande de dépôt |
| `PATCH` | `/api/deposits/:id` | Mettre à jour le statut |

### Retraits — 🔒 JWT requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/withdrawals` | Liste des retraits de l'utilisateur connecté |
| `POST` | `/api/withdrawals` | Soumettre une demande de retrait (min $50) |
| `PATCH` | `/api/withdrawals/:id` | Mettre à jour le statut |

### Referral — 🔒 JWT requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/referral` | Code referral + statistiques + liste des filleuls |

### Utilisateurs / Admin — 🔒 JWT requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/users` | Liste de tous les utilisateurs |
| `POST` | `/api/users` | Créer un utilisateur |
| `PATCH` | `/api/users/:id/password` | Changer le mot de passe d'un utilisateur |
| `DELETE` | `/api/users/:id` | Supprimer un utilisateur |

---

## 🗄️ Base de données — Modèles Prisma

```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Trade {
  id          Int       @id @default(autoincrement())
  symbol      String    @default("XAUUSD")
  type        String    // BUY | SELL
  openTime    DateTime
  closeTime   DateTime?
  openPrice   Float
  closePrice  Float?
  lotSize     Float
  stopLoss    Float
  takeProfit  Float
  profit      Float?
  pips        Float?
  status      String    @default("OPEN")   // OPEN | CLOSED
  comment     String?
  magicNumber Int?
}

model DailyStat {
  date        DateTime @unique
  totalTrades Int
  wins        Int
  losses      Int
  grossProfit Float
  grossLoss   Float
  netProfit   Float
  equity      Float
  drawdown    Float
}

model Deposit {
  userId    Int
  amount    Float
  method    String    // BANK | CRYPTO_USDT | CRYPTO_BTC | CARD
  txHash    String?
  status    String    @default("PENDING")  // PENDING | CONFIRMED | REJECTED
}

model Withdrawal {
  userId    Int
  amount    Float
  method    String    // BANK | CRYPTO_USDT | CRYPTO_BTC
  address   String
  status    String    @default("PENDING")  // PENDING | PROCESSING | COMPLETED | REJECTED
}

model Referral {
  referrerId       Int
  referralCode     String  @unique
  referredUsername String?
  depositTotal     Float   @default(0)
  commission       Float   @default(0)
  status           String  @default("ACTIVE")  // ACTIVE | INACTIVE
}
```

---

## 📄 Pages du site

| Route | Accès | Description |
|-------|-------|-------------|
| `/` | 🌐 Public | Page d'accueil — présentation du robot et des performances |
| `/login` | 🌐 Public | Formulaire de connexion |
| `/dashboard` | 🔒 Privé | Graphiques d'équité, winrate mensuel, stats globales |
| `/trades` | 🔒 Privé | Historique paginé des trades avec filtres |
| `/deposits` | 🔒 Privé | Soumettre et suivre les dépôts |
| `/withdrawals` | 🔒 Privé | Soumettre et suivre les retraits |
| `/referral` | 🔒 Privé | Programme de parrainage + suivi des filleuls |
| `/admin/users` | 🔒 Privé | Gestion des comptes utilisateurs + lien Prisma Studio |

---

## ⚙️ Administration & Accès DB

### Via le site — Page Admin

Accessible depuis le menu **⚙️ Admin** → `http://localhost:5173/admin/users`

- ➕ **Créer** un compte (username + mot de passe)
- 🔑 **Changer** le mot de passe de n'importe quel utilisateur
- 🗑️ **Supprimer** un utilisateur (avec confirmation)

### Via Prisma Studio — Interface DB

```bash
cd backend
npx prisma studio
```

→ Ouvrir **http://localhost:5555**

Prisma Studio permet de visualiser et modifier directement toutes les tables :
`User`, `Trade`, `DailyStat`, `Deposit`, `Withdrawal`, `Referral`

---

## 🔐 Compte par défaut

Après exécution du seed (`node prisma/seed.js`), un compte administrateur est créé :

| Champ | Valeur |
|-------|--------|
| **Username** | `admin` |
| **Password** | `Trading2026!` |

> 💡 Changez ce mot de passe immédiatement en production via **⚙️ Admin → 🔑 Pwd**.

---

## 👤 Auteur

**zoulouhh**  
Projet portfolio — [Holberton School](https://www.holbertonschool.com)  
GitHub : [@zoulouhh](https://github.com/zoulouhh)

---

<div align="center">
  <sub>Built with ❤️ — XAUUSD Algo Robot © 2026</sub>
</div>
