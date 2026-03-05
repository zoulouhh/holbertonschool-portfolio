# XAUUSD Algo Robot (MT5)

Expert Advisor MQL5 pour trader automatiquement `XAUUSD` selon un cadre multi-timeframe:

- Analyse principale: `M15`
- Confirmation tendance: `H1`
- Timing d'entree: `M5`

La strategie implemente:

- Tendance: EMA 50 / EMA 200
- Momentum: RSI 14
- Volatilite: ATR 14
- Structure: Break of Structure (BOS) + retest
- Gestion du risque: lot auto par risque fixe
- Protection: spread max, drawdown journalier, filtres sessions/news
- Gestion active: break-even + trailing ATR

## Fichier principal

- `XAUUSD_Algo_Robot.mq5`

## Regles de trading

### BUY

- EMA50(H1) > EMA200(H1)
- BOS haussier detecte sur M15 (cassure d'un plus haut recent)
- Retest du niveau casse sur M5
- RSI(M15) > 55
- ATR(M15) suffisant
- Session London ou New York

### SELL

- EMA50(H1) < EMA200(H1)
- BOS baissier detecte sur M15 (cassure d'un plus bas recent)
- Retest du niveau casse sur M5
- RSI(M15) < 45
- ATR(M15) suffisant
- Session London ou New York

## Gestion du risque

- Risque par trade configurable (par defaut: `1%`)
- Stop Loss: `1.5 x ATR`
- Take Profit: `3.0 x ATR`
- Break-even a `1R`
- Trailing stop ATR apres `1R`
- Maximum de positions simultanees: `2`
- Pas de martingale, pas de grid

## Filtres de securite

- Blocage si spread > seuil
- Blocage si drawdown journalier > seuil
- Blocage si ATR trop faible
- Blocage hors sessions London / New York
- Filtre news majeures USD (Fed, CPI, NFP) via calendrier economique MT5

## Parametres configurables

Tous les points demandables sont exposes en `input` dans l'EA:

- Horaires de sessions (GMT)
- EMA, RSI, ATR
- Risk %
- Multiplicateurs SL / TP
- Trailing stop
- Spread max
- Drawdown journalier max
- Filtres avancees: liquidity sweep, order block, volume

## Installation (MetaTrader 5)

1. Ouvrir MetaEditor.
2. Creer un nouvel Expert Advisor.
3. Copier le contenu de `XAUUSD_Algo_Robot.mq5`.
4. Compiler.
5. Attacher l'EA sur `XAUUSD`.

## Backtesting recommande (obligatoire)

Dans le Strategy Tester MT5:

- Symbole: `XAUUSD`
- Periode: au moins `5 ans`
- Mode: Every tick based on real ticks (si possible)
- Spread: realiste broker

Objectifs cibles:

- Winrate >= `45%`
- Profit Factor > `1.5`
- Drawdown max < `20%`

## Notes importantes

- Le filtre news utilise le calendrier economique integre MT5; selon broker/serveur, la disponibilite peut varier.
- Ajuster les seuils ATR/spread selon le broker (digits, tick value, liquidite).
- Ce robot est une base robuste et parametrable, mais toute mise en production doit passer par optimisation forward + validation sur compte demo.