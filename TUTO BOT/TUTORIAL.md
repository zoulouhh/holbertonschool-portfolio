# Tutoriel complet — XAUUSD Algo Robot

> **Compatible** : MetaTrader 5 (`XAUUSD_Algo_Robot.mq5`) et MetaTrader 4 (`XAUUSD_Algo_Robot.mq4`)

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installation MT5](#2-installation-mt5)
3. [Installation MT4](#3-installation-mt4)
4. [Configuration des paramètres](#4-configuration-des-paramètres)
5. [Lancer le robot en live](#5-lancer-le-robot-en-live)
6. [Lire le dashboard](#6-lire-le-dashboard)
7. [Backtesting sur 5 ans (MT5)](#7-backtesting-sur-5-ans-mt5)
8. [Optimisation des paramètres](#8-optimisation-des-paramètres)
9. [Filtre news — configuration manuelle (MT4)](#9-filtre-news--configuration-manuelle-mt4)
10. [Checklist journalière](#10-checklist-journalière)
11. [Comprendre la stratégie](#11-comprendre-la-stratégie)
12. [FAQ et dépannage](#12-faq-et-dépannage)

---

## 1. Prérequis

| Élément | Détail |
|---|---|
| Plateforme | MetaTrader 5 **ou** MetaTrader 4 |
| Broker | Compte ECN/STP recommandé, spread XAUUSD < 30 pts en session London/NY |
| Capital minimum | 500 $ (idéal : 1 000 $+) |
| Connexion | VPS ou PC allumé 24h/24 durant les sessions London et New York |
| Données historiques | Minimum 5 ans de tick data pour le backtest |

---

## 2. Installation MT5

### Étape 1 — Ouvrir MetaEditor

Dans MetaTrader 5 :
```
Menu principal → Outils → MetaEditor (ou touche F4)
```

### Étape 2 — Créer le fichier EA

Dans MetaEditor :
```
Fichier → Nouveau → Expert Advisor (template) → Suivant → Donner le nom : XAUUSD_Algo_Robot → Terminer
```

### Étape 3 — Coller le code

1. Sélectionner tout le code du modèle généré (`Ctrl+A`)
2. Supprimer
3. Coller le contenu complet de `XAUUSD_Algo_Robot.mq5`

### Étape 4 — Compiler

```
F7  ou  Bouton "Compiler" dans la barre d'outils
```

> ✅ **Résultat attendu** : `0 errors, 0 warnings` dans l'onglet "Errors"

### Étape 5 — Localiser l'EA compilé

L'EA apparaît automatiquement dans l'Explorateur MetaTrader 5 :
```
Explorateur → Expert Advisors → XAUUSD_Algo_Robot
```

---

## 3. Installation MT4

### Étape 1 — Ouvrir MetaEditor MT4

```
Outils → MetaQuotes Language Editor (F4)
```

### Étape 2 — Créer l'EA

```
Fichier → Nouveau → Expert Advisor → Nom : XAUUSD_Algo_Robot → OK
```

### Étape 3 — Coller et compiler

1. Remplacer tout le contenu par `XAUUSD_Algo_Robot.mq4`
2. Compiler avec `F7`

> ✅ **Résultat attendu** : `0 errors`

### ⚠️ Différence MT4 vs MT5 — Filtre news

MT4 ne dispose pas du calendrier économique intégré. Le filtre news doit être configuré **manuellement** (voir [section 9](#9-filtre-news--configuration-manuelle-mt4)).

---

## 4. Configuration des paramètres

Pour accéder aux paramètres, **double-cliquer** sur l'EA dans l'Explorateur, puis aller dans l'onglet **"Inputs"** (ou **"Parametres"**).

### Paramètres principaux

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `InpMagicNumber` | 20260305 | Identifiant unique de l'EA — ne pas modifier si plusieurs EAs tournent |
| `InpRiskPercent` | 1.0 | Risque par trade en % du solde |
| `InpSL_ATR_Mult` | 1.5 | Multiplicateur ATR pour le Stop Loss |
| `InpTP_ATR_Mult` | 3.0 | Multiplicateur ATR pour le Take Profit |
| `InpMaxSpreadPoints` | 30 | Spread maximum autorisé en points |
| `InpMaxDailyDrawdownPercent` | 10.0 | Drawdown journalier maximum avant blocage |
| `InpMaxSimultaneousTrades` | 2 | Nombre maximum de positions simultanées |

### Sessions (GMT)

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `InpLondonStartGMT` | "08:00" | Début session London |
| `InpLondonEndGMT` | "11:30" | Fin session London |
| `InpNewYorkStartGMT` | "13:30" | Début session New York |
| `InpNewYorkEndGMT` | "17:00" | Fin session New York |

> ⚠️ Ces horaires sont en **GMT pur** (UTC+0). Vérifier l'heure GMT du serveur de ton broker et ajuster si nécessaire.

### Indicateurs

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `InpFastEMA` | 50 | Période EMA rapide (tendance H1) |
| `InpSlowEMA` | 200 | Période EMA lente (tendance H1) |
| `InpRSIPeriod` | 14 | Période RSI (M15) |
| `InpATRPeriod` | 14 | Période ATR (M15) |
| `InpMinATRPoints` | 80.0 | ATR minimum pour valider la volatilité |
| `InpBOSLookbackBars` | 20 | Nombre de bougies M15 pour détecter le plus haut/bas |
| `InpRetestTolerancePoints` | 50 | Tolérance en points pour valider le retest |

### Gestion active

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `InpUseBreakEven` | true | Activer le break-even à +1R |
| `InpUseTrailing` | true | Activer le trailing stop |
| `InpTrailATRMult` | 1.0 | Multiplicateur ATR pour le trailing |

### Filtres avancés (désactivés par défaut)

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `InpUseLiquiditySweepFilter` | false | Filtre stop hunt (wick absorbant la liquidité) |
| `InpUseOrderBlockFilter` | false | Filtre order block SMC |
| `InpUseVolumeFilter` | false | Filtre volume (tick volume > moyenne) |

> 💡 Activer ces filtres **après backtesting** pour mesurer leur impact sur le winrate.

---

## 5. Lancer le robot en live

### Sur un graphique XAUUSD

1. Ouvrir un graphique **XAUUSD** (n'importe quel timeframe — le robot gère lui-même M5/M15/H1)
2. **Glisser-déposer** l'EA depuis l'Explorateur sur le graphique
3. Dans la fenêtre qui s'ouvre :
   - Onglet **"Common"** : cocher ✅ **"Allow live trading"** et ✅ **"Allow DLL imports"**
   - Onglet **"Inputs"** : vérifier/modifier les paramètres
4. Cliquer **OK**
5. Vérifier que l'icône EA en haut à droite du graphique est **verte** ✅

### Indicateur de statut MT5

| Couleur icône | Signification |
|---|---|
| ✅ Vert | EA actif et trading autorisé |
| ⛔ Gris | EA attaché mais trading désactivé |
| ❌ Absence | EA non chargé |

---

## 6. Lire le dashboard

Le robot affiche un tableau de bord en haut à gauche du graphique, mis à jour à chaque tick.

```
╔══════════════════════════════╗
║   XAUUSD ALGO ROBOT v1.00    ║
╚══════════════════════════════╝
─────────────────────────────────
  Session   : ACTIVE ✔           ← Trading autorisé (session London ou NY)
  News      : OK ✔               ← Aucun événement majeur en cours
  Spread    : 18.0 pts  OK ✔     ← Spread en dessous du seuil
  DD today  : 1.23% OK ✔        ← Drawdown journalier sous la limite
─────────────────────────────────
  Trend(H1) : BULLISH ▲          ← EMA50 > EMA200 sur H1
  EMA50     : 2985.340           ← Valeur EMA50
  EMA200    : 2970.120           ← Valeur EMA200
  RSI(M15)  : 61.45              ← RSI momentum M15
  ATR(M15)  : 142.0 pts          ← Volatilité actuelle
─────────────────────────────────
  BOS signals: BUY level 2978.50  ← Niveau BOS en attente de retest
─────────────────────────────────
  Open trades: 1 / 2             ← 1 position ouverte sur 2 max
  Equity     : 1043.28 USD
─────────────────────────────────
```

### Interprétation rapide

| Indicateur | Signal positif | Action attendue |
|---|---|---|
| Session | ACTIVE | Robot peut trader |
| News | OK | Aucun blocage news |
| Spread | OK | Entrées autorisées |
| Trend | BULLISH / BEARISH | Direction confirmée |
| RSI | > 55 (BUY) / < 45 (SELL) | Momentum aligné |
| ATR | Suffisant | Volatilité ok pour SL/TP |
| BOS signals | Niveau affiché | Retest en cours de détection |

---

## 7. Backtesting sur 5 ans (MT5)

### Étape 1 — Ouvrir le Strategy Tester

```
Menu → Affichage → Strategy Tester  (ou Ctrl+R)
```

### Étape 2 — Configuration

| Paramètre | Valeur recommandée |
|---|---|
| Expert Advisor | `XAUUSD_Algo_Robot` |
| Symbole | `XAUUSD` |
| Période | `M5` (période d'entrée) |
| Mode | `Every tick based on real ticks` si disponible, sinon `Every tick` |
| Date début | 5 ans en arrière (ex: 01/01/2021) |
| Date fin | Aujourd'hui |
| Dépôt initial | 1 000 $ (ou ton capital réel) |
| Spread | `Current` ou valeur réaliste (ex: 20) |

### Étape 3 — Charger les données historiques

Si les données sont insuffisantes :
```
MetaTrader 5 → Outils → Historique → XAUUSD → Charger les données tick
```

### Étape 4 — Lancer et analyser

Cliquer **"Start"**. À la fin du test, consulter les onglets :

| Onglet | Ce qu'on cherche |
|---|---|
| **Résultats** | Liste des trades |
| **Graphique** | Courbe d'équité (doit être ascendante) |
| **Statistiques** | Winrate, Profit Factor, Drawdown |

### Objectifs cibles

| Indicateur | Cible minimale |
|---|---|
| Winrate | ≥ 45 % |
| Profit Factor | > 1.5 |
| Drawdown max | < 20 % |
| Ratio Sharpe | > 1.0 (idéal) |

---

## 8. Optimisation des paramètres

### Étape 1 — Activer l'optimisation

Dans le Strategy Tester :
```
Case "Optimization" → cocher → choisir "Slow complete algorithm" ou "Fast genetic algorithm"
```

### Étape 2 — Paramètres à optimiser en priorité

| Paramètre | Plage suggérée | Pas |
|---|---|---|
| `InpSL_ATR_Mult` | 1.0 → 2.5 | 0.25 |
| `InpTP_ATR_Mult` | 2.0 → 5.0 | 0.5 |
| `InpMinATRPoints` | 50 → 150 | 10 |
| `InpBOSLookbackBars` | 10 → 30 | 5 |
| `InpRetestTolerancePoints` | 20 → 80 | 10 |
| `InpRiskPercent` | 0.5 → 2.0 | 0.5 |

### Étape 3 — Critère d'optimisation

Choisir **"Custom max"** avec pour formule recommandée :
```
Profit Factor × (1 - max_drawdown_percent/100)
```
Ou utiliser le critère prédéfini **"Balance + max drawdown criteria"**.

### ⚠️ Règles anti-overfitting

- Ne jamais optimiser sur 100% des données : utiliser **80% pour l'optimisation** et **20% en forward test**
- Préférer des paramètres qui donnent de bons résultats sur plusieurs plages (robustesse)
- Si le Profit Factor > 3 sur le backtest mais < 1 en live : signe d'overfitting

---

## 9. Filtre news — configuration manuelle (MT4)

MT4 ne dispose pas d'API calendrier. Avant chaque événement majeur :

1. Consulter un agenda économique (ex: Investing.com, Forex Factory)
2. Repérer les événements **impact FORT** USD : NFP, CPI, FOMC, taux Fed
3. Convertir l'heure en **GMT**
4. Renseigner dans les paramètres MT4 :

```
UseManualNewsFilter = true
NewsEvent1GMT = "13:30"   ← ex: NFP prévu à 13:30 GMT
NewsEvent2GMT = "18:00"   ← ex: FOMC prévu à 18:00 GMT
NewsEvent3GMT = "00:00"   ← laisser 00:00 si pas de 3e event
```

Le robot bloquera automatiquement les 30 minutes avant et après chaque événement renseigné.

> 💡 **MT5** : le filtre est entièrement automatique via l'API `CalendarValueHistory`. Aucune action requise.

---

## 10. Checklist journalière

À effectuer **avant l'ouverture de la session London (08:00 GMT)** :

- [ ] Vérifier l'agenda économique du jour (Forex Factory / Investing.com)
- [ ] Mettre à jour les heures de news dans MT4 si nécessaire
- [ ] Vérifier que le dashboard affiche **Session : CLOSED** (normal avant 08:00 GMT)
- [ ] Vérifier que le spread est normal (< 30 pts)
- [ ] Vérifier que la connexion VPS/PC est stable
- [ ] Vérifier le drawdown de la veille dans l'historique

À effectuer **en fin de session NY (17:00 GMT)** :

- [ ] Vérifier qu'aucune position n'est restée ouverte sur un spike
- [ ] Consulter les trades du jour dans l'historique
- [ ] Mettre à jour les niveaux BOS si besoin (informatif)

---

## 11. Comprendre la stratégie

### Logique complète d'un trade BUY

```
H1  :  EMA50 > EMA200  →  Tendance haussière confirmée
    ↓
M15 :  Cassure d'un plus haut récent (20 dernières bougies)
       →  BOS haussier détecté
       →  RSI(M15) > 55  (momentum confirm)
       →  ATR(M15) > seuil minimum  (volatilité ok)
    ↓
M5  :  Le prix reteste le niveau cassé par le bas
       →  Bougie M5 close AU-DESSUS du niveau de break
       →  Entrée au marché
    ↓
SL  :  Ask − (ATR × 1.5)
TP  :  Ask + (ATR × 3.0)
RR  :  1:2 minimum (3.0/1.5)
    ↓
Gestion :
   • Profit atteint +1R  →  SL déplacé au break-even
   • Trailing  activé    →  SL suit le prix (ATR × 1.0)
```

### Logique complète d'un trade SELL (inverse)

```
H1  :  EMA50 < EMA200  →  Tendance baissière
M15 :  Cassure d'un plus bas récent + RSI < 45 + ATR ok
M5  :  Retest du niveau cassé par le haut (close en dessous)
SL  :  Bid + (ATR × 1.5)
TP  :  Bid − (ATR × 3.0)
```

### Calcul automatique du lot

```
Risque $  =  Solde × (RiskPercent / 100)
            ex : 1 000 $ × 1% = 10 $

Lot       =  Risque $ / (distance SL en $ pour 1 lot)
            ex : SL = 200 pts sur XAUUSD
                 1 lot XAUUSD = 100 oz → tick value ≈ 1 $ / pt / lot
                 Lot = 10 / 200 = 0.05 lot
```

---

## 12. FAQ et dépannage

**Q : Le robot ne prend aucun trade depuis plusieurs jours.**

Vérifier dans le dashboard :
- Session affiche-t-elle `ACTIVE` aux bonnes heures ?
- ATR est-il suffisant (`> 80 pts` par défaut) ?
- Y a-t-il un signal BOS affiché dans le dashboard ?
- Le spread est-il sous 30 pts ?

Si tout est OK mais aucun signal BOS : le marché est dans une phase de range sans cassure nette de structure — c'est normal et attendu.

---

**Q : L'EA affiche "LIMIT HIT" pour le drawdown.**

Le robot a perdu > 10% du capital en une journée. Il est bloqué jusqu'au lendemain. Analyser les trades perdants de la journée pour comprendre si c'est un problème de paramétrage ou une condition de marché exceptionnelle (ex: annonce surprise).

---

**Q : Erreur de compilation `undeclared identifier`.**

S'assurer d'utiliser MetaTrader **5** pour le fichier `.mq5` et MetaTrader **4** pour le fichier `.mq4`. Les deux fichiers ne sont pas interchangeables.

---

**Q : Le robot ouvre des trades dans la mauvaise direction.**

Vérifier que la tendance H1 est bien alignée (EMA50/EMA200). Si le marché est en phase de range sur H1, les EMA se croisent souvent : augmenter la période TF de tendance ou ajouter un filtre de pente EMA.

---

**Q : Le lot calculé est très petit (ex: 0.01).**

C'est normal avec un petit capital (< 500 $) et un SL large. Le robot respecte strictement le risque de 1%. Pour avoir des lots plus grands, augmenter le capital ou réduire `InpSL_ATR_Mult`.

---

**Q : Je veux tester sans risque réel.**

Toujours commencer sur un **compte démo** avec les mêmes paramètres qu'en live. Observer au minimum 2 à 4 semaines de trading en démo avant le passage en live.

---

**Q : Puis-je utiliser ce robot sur d'autres paires ?**

Le robot est calibré pour XAUUSD (seuils ATR en points, volatilité, sessions). Pour une autre paire, adapter :
- `InpMinATRPoints` selon la volatilité de la paire
- `InpMaxSpreadPoints` selon le spread habituel
- Les horaires de sessions selon la liquidité de la paire

---

*Document généré le 05/03/2026 — XAUUSD Algo Robot v1.00*
