//+------------------------------------------------------------------+
//|  XAUUSD_Algo_Robot.mq4                                           |
//|  Version MQL4 – compatible MetaTrader 4                          |
//|  Stratégie multi-timeframe XAUUSD                                |
//|  H1 tendance (EMA50/200) + M15 BOS/RSI/ATR + M5 retest          |
//+------------------------------------------------------------------+
#property strict
#property description "XAUUSD multi-TF EA – MQL4 version"
#property version     "1.00"

//--- Paramètres généraux
extern int    MagicNumber                = 20260305;
extern string PairComment                = "XAU_BOS";

//--- Timeframes (valeurs numériques MQL4)
//    PERIOD_H1=60, PERIOD_M15=15, PERIOD_M5=5
extern int    TrendTF_Minutes            = 60;   // H1
extern int    MainTF_Minutes             = 15;   // M15
extern int    EntryTF_Minutes            = 5;    // M5

//--- Indicateurs
extern int    FastEMA                    = 50;
extern int    SlowEMA                    = 200;
extern int    RSIPeriod                  = 14;
extern int    ATRPeriod                  = 14;

//--- Risque
extern double RiskPercent                = 1.0;
extern double SL_ATR_Mult                = 1.5;
extern double TP_ATR_Mult                = 3.0;

//--- Gestion active
extern bool   UseBreakEven               = true;
extern bool   UseTrailing                = true;
extern double TrailATRMult               = 1.0;

//--- Sessions GMT (format HH:MM)
extern string LondonStartGMT             = "08:00";
extern string LondonEndGMT               = "11:30";
extern string NewYorkStartGMT            = "13:30";
extern string NewYorkEndGMT              = "17:00";

//--- Sécurité
extern int    MaxSpreadPoints            = 30;
extern double MinATRPoints               = 80.0;
extern int    MaxSimultaneousTrades      = 2;
extern double MaxDailyDrawdownPercent    = 10.0;

//--- BOS
extern int    BOSLookbackBars            = 20;
extern int    RetestTolerancePoints      = 50;

//--- Filtre news manuel (créneau à bloquer, format HH:MM GMT)
//    MT4 ne dispose pas de l'API calendrier économique.
//    Renseigner l'heure GMT d'un événement majeur prévu.
//    Laisser à "00:00" pour désactiver.
extern bool   UseManualNewsFilter        = false;
extern string NewsEvent1GMT              = "00:00";
extern string NewsEvent2GMT              = "00:00";
extern string NewsEvent3GMT              = "00:00";
extern int    NewsPauseBeforeMinutes     = 30;
extern int    NewsPauseAfterMinutes      = 30;

//--- Filtres avancés
extern bool   UseLiquiditySweepFilter    = false;
extern bool   UseOrderBlockFilter        = false;
extern bool   UseVolumeFilter            = false;
extern int    VolumeLookbackBars         = 20;

//--- Variables globales
double g_buyBreakLevel   = 0.0;
double g_sellBreakLevel  = 0.0;
bool   g_buySignalUsed   = false;
bool   g_sellSignalUsed  = false;
datetime g_buyBOSTime    = 0;
datetime g_sellBOSTime   = 0;

double g_buyOBHigh = 0.0;
double g_buyOBLow  = 0.0;
bool   g_hasBuyOB  = false;
double g_sellOBHigh = 0.0;
double g_sellOBLow  = 0.0;
bool   g_hasSellOB  = false;

int    g_currentDayOfYear = -1;
double g_dayStartEquity   = 0.0;

datetime g_lastM5BarTime  = 0;
datetime g_lastM15BarTime = 0;

//+------------------------------------------------------------------+
//| Utilitaires                                                       |
//+------------------------------------------------------------------+
int ParseTimeToMinutes(const string hhmm)
{
   string parts[];
   int n = StringSplit(hhmm, ':', parts);
   if(n != 2) return -1;
   int hh = (int)StringToInteger(parts[0]);
   int mm = (int)StringToInteger(parts[1]);
   if(hh < 0 || hh > 23 || mm < 0 || mm > 59) return -1;
   return hh * 60 + mm;
}

bool IsMinutesInWindow(const int current, const int start, const int end)
{
   if(start < 0 || end < 0) return false;
   if(start <= end)
      return (current >= start && current <= end);
   return (current >= start || current <= end);
}

//+------------------------------------------------------------------+
//| Session de trading                                                |
//+------------------------------------------------------------------+
bool IsTradingSession()
{
   datetime gmtNow = TimeGMT();
   MqlDateTime t;
   TimeToStruct(gmtNow, t);
   int cur = t.hour * 60 + t.min;

   bool inLondon = IsMinutesInWindow(cur, ParseTimeToMinutes(LondonStartGMT),
                                          ParseTimeToMinutes(LondonEndGMT));
   bool inNY     = IsMinutesInWindow(cur, ParseTimeToMinutes(NewYorkStartGMT),
                                          ParseTimeToMinutes(NewYorkEndGMT));
   return (inLondon || inNY);
}

//+------------------------------------------------------------------+
//| Filtre news manuel                                                |
//+------------------------------------------------------------------+
bool IsCloseToNewsEvent(const string eventTimeGMT)
{
   int evMin = ParseTimeToMinutes(eventTimeGMT);
   if(evMin < 0 || evMin == 0) return false;

   datetime gmtNow = TimeGMT();
   MqlDateTime t;
   TimeToStruct(gmtNow, t);
   int cur = t.hour * 60 + t.min;

   int diffBefore = evMin - cur;
   int diffAfter  = cur - evMin;

   return ((diffBefore >= 0 && diffBefore <= NewsPauseBeforeMinutes) ||
           (diffAfter  >= 0 && diffAfter  <= NewsPauseAfterMinutes));
}

bool IsInNewsPauseWindow()
{
   if(!UseManualNewsFilter) return false;
   if(IsCloseToNewsEvent(NewsEvent1GMT)) return true;
   if(IsCloseToNewsEvent(NewsEvent2GMT)) return true;
   if(IsCloseToNewsEvent(NewsEvent3GMT)) return true;
   return false;
}

//+------------------------------------------------------------------+
//| Spread en points                                                  |
//+------------------------------------------------------------------+
double GetSpreadPoints()
{
   double spread = MarketInfo(Symbol(), MODE_SPREAD);
   if(spread <= 0.0) return 999999.0;
   return spread;
}

//+------------------------------------------------------------------+
//| Nombre de positions ouvertes par cet EA                          |
//+------------------------------------------------------------------+
int CountOpenPositionsForEA()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != MagicNumber) continue;
      if(OrderType() == OP_BUY || OrderType() == OP_SELL)
         count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Drawdown journalier                                               |
//+------------------------------------------------------------------+
void UpdateDailyEquityAnchor()
{
   MqlDateTime t;
   TimeToStruct(TimeGMT(), t);
   if(g_currentDayOfYear != t.day_of_year)
   {
      g_currentDayOfYear = t.day_of_year;
      g_dayStartEquity   = AccountEquity();
   }
}

bool IsDailyDrawdownExceeded()
{
   UpdateDailyEquityAnchor();
   if(g_dayStartEquity <= 0.0) return false;
   double dd = ((g_dayStartEquity - AccountEquity()) / g_dayStartEquity) * 100.0;
   return (dd >= MaxDailyDrawdownPercent);
}

//+------------------------------------------------------------------+
//| High / Low récents sur un TF (iHigh/iLow MQL4)                   |
//+------------------------------------------------------------------+
double GetRecentHigh(const int tf, const int startShift, const int count)
{
   double maxH = -DBL_MAX;
   for(int i = startShift; i < startShift + count; i++)
   {
      double h = iHigh(Symbol(), tf, i);
      if(h > maxH) maxH = h;
   }
   return maxH;
}

double GetRecentLow(const int tf, const int startShift, const int count)
{
   double minL = DBL_MAX;
   for(int i = startShift; i < startShift + count; i++)
   {
      double l = iLow(Symbol(), tf, i);
      if(l < minL) minL = l;
   }
   return minL;
}

//+------------------------------------------------------------------+
//| Order Blocks                                                      |
//+------------------------------------------------------------------+
void FindOrderBlockForBuy()
{
   g_hasBuyOB = false;
   for(int i = 2; i <= 20; i++)
   {
      if(iClose(Symbol(), MainTF_Minutes, i) < iOpen(Symbol(), MainTF_Minutes, i))
      {
         g_buyOBHigh = iHigh(Symbol(), MainTF_Minutes, i);
         g_buyOBLow  = iLow(Symbol(), MainTF_Minutes, i);
         g_hasBuyOB  = true;
         return;
      }
   }
}

void FindOrderBlockForSell()
{
   g_hasSellOB = false;
   for(int i = 2; i <= 20; i++)
   {
      if(iClose(Symbol(), MainTF_Minutes, i) > iOpen(Symbol(), MainTF_Minutes, i))
      {
         g_sellOBHigh = iHigh(Symbol(), MainTF_Minutes, i);
         g_sellOBLow  = iLow(Symbol(), MainTF_Minutes, i);
         g_hasSellOB  = true;
         return;
      }
   }
}

//+------------------------------------------------------------------+
//| Détection BOS sur M15 — une fois par bougie fermée               |
//+------------------------------------------------------------------+
void UpdateBOSSignals()
{
   datetime m15Bar = iTime(Symbol(), MainTF_Minutes, 1);
   if(m15Bar == 0 || m15Bar == g_lastM15BarTime) return;
   g_lastM15BarTime = m15Bar;

   double close1    = iClose(Symbol(), MainTF_Minutes, 1);
   double recentHigh = GetRecentHigh(MainTF_Minutes, 2, BOSLookbackBars);
   double recentLow  = GetRecentLow(MainTF_Minutes, 2, BOSLookbackBars);

   if(close1 > recentHigh)
   {
      g_buyBreakLevel = recentHigh;
      g_buyBOSTime    = m15Bar;
      g_buySignalUsed = false;
      if(UseOrderBlockFilter) FindOrderBlockForBuy();
   }
   if(close1 < recentLow)
   {
      g_sellBreakLevel = recentLow;
      g_sellBOSTime    = m15Bar;
      g_sellSignalUsed = false;
      if(UseOrderBlockFilter) FindOrderBlockForSell();
   }
}

//+------------------------------------------------------------------+
//| Calcul de la taille de lot par risque fixe                       |
//+------------------------------------------------------------------+
double NormalizeLots(const double rawLots)
{
   double minLot  = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot  = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
   if(lotStep <= 0.0) return 0.0;

   double lots = MathMax(minLot, MathMin(maxLot, rawLots));
   lots = MathFloor(lots / lotStep) * lotStep;
   int digits = (int)MathRound(-MathLog10(lotStep));
   return NormalizeDouble(lots, MathMax(0, digits));
}

double CalculateLotByRisk(const double slPriceDistance)
{
   if(slPriceDistance <= 0.0) return 0.0;

   double riskMoney = AccountBalance() * (RiskPercent / 100.0);
   if(riskMoney <= 0.0) return 0.0;

   double tickVal  = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize = MarketInfo(Symbol(), MODE_TICKSIZE);
   if(tickVal <= 0.0 || tickSize <= 0.0) return 0.0;

   double lossPerLot = (slPriceDistance / tickSize) * tickVal;
   if(lossPerLot <= 0.0) return 0.0;

   return NormalizeLots(riskMoney / lossPerLot);
}

//+------------------------------------------------------------------+
//| Conditions d'entrée                                               |
//+------------------------------------------------------------------+
bool TrendIsBullish()
{
   double fast = iMA(Symbol(), TrendTF_Minutes, FastEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slow = iMA(Symbol(), TrendTF_Minutes, SlowEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   return (fast > slow);
}

bool TrendIsBearish()
{
   double fast = iMA(Symbol(), TrendTF_Minutes, FastEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slow = iMA(Symbol(), TrendTF_Minutes, SlowEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   return (fast < slow);
}

bool RSIIsBullish()
{
   return (iRSI(Symbol(), MainTF_Minutes, RSIPeriod, PRICE_CLOSE, 1) > 55.0);
}

bool RSIIsBearish()
{
   return (iRSI(Symbol(), MainTF_Minutes, RSIPeriod, PRICE_CLOSE, 1) < 45.0);
}

double GetATR()
{
   return iATR(Symbol(), MainTF_Minutes, ATRPeriod, 1);
}

bool IsVolatilitySufficient()
{
   double atr = GetATR();
   if(atr <= 0.0) return false;
   return ((atr / _Point) >= MinATRPoints);
}

//+------------------------------------------------------------------+
//| Retest BOS sur M5                                                 |
//+------------------------------------------------------------------+
bool RetestBuyPass()
{
   if(g_buyBreakLevel <= 0.0 || g_buySignalUsed || g_buyBOSTime <= 0) return false;
   double tol   = RetestTolerancePoints * _Point;
   double low1  = iLow(Symbol(), EntryTF_Minutes, 1);
   double close1 = iClose(Symbol(), EntryTF_Minutes, 1);
   return (low1 <= (g_buyBreakLevel + tol) && close1 > g_buyBreakLevel);
}

bool RetestSellPass()
{
   if(g_sellBreakLevel <= 0.0 || g_sellSignalUsed || g_sellBOSTime <= 0) return false;
   double tol   = RetestTolerancePoints * _Point;
   double high1 = iHigh(Symbol(), EntryTF_Minutes, 1);
   double close1 = iClose(Symbol(), EntryTF_Minutes, 1);
   return (high1 >= (g_sellBreakLevel - tol) && close1 < g_sellBreakLevel);
}

//+------------------------------------------------------------------+
//| Filtres avancés                                                   |
//+------------------------------------------------------------------+
bool VolumeFilterPass()
{
   if(!UseVolumeFilter) return true;
   long volNow = iVolume(Symbol(), EntryTF_Minutes, 1);
   if(volNow <= 0) return false;
   double avg = 0.0;
   int valid = 0;
   for(int i = 2; i < 2 + VolumeLookbackBars; i++)
   {
      long v = iVolume(Symbol(), EntryTF_Minutes, i);
      if(v > 0) { avg += (double)v; valid++; }
   }
   if(valid == 0) return false;
   avg /= valid;
   return ((double)volNow >= avg);
}

bool LiquiditySweepBuyPass()
{
   if(!UseLiquiditySweepFilter) return true;
   double low1   = iLow(Symbol(), EntryTF_Minutes, 1);
   double open1  = iOpen(Symbol(), EntryTF_Minutes, 1);
   double close1 = iClose(Symbol(), EntryTF_Minutes, 1);
   double body   = MathAbs(close1 - open1);
   double wick   = MathMin(open1, close1) - low1;
   double prevLow = GetRecentLow(EntryTF_Minutes, 2, 10);
   if(low1 >= prevLow || body <= 0.0) return false;
   return (wick >= body);
}

bool LiquiditySweepSellPass()
{
   if(!UseLiquiditySweepFilter) return true;
   double high1  = iHigh(Symbol(), EntryTF_Minutes, 1);
   double open1  = iOpen(Symbol(), EntryTF_Minutes, 1);
   double close1 = iClose(Symbol(), EntryTF_Minutes, 1);
   double body   = MathAbs(close1 - open1);
   double wick   = high1 - MathMax(open1, close1);
   double prevHigh = GetRecentHigh(EntryTF_Minutes, 2, 10);
   if(high1 <= prevHigh || body <= 0.0) return false;
   return (wick >= body);
}

bool OrderBlockBuyPass()
{
   if(!UseOrderBlockFilter) return true;
   if(!g_hasBuyOB) return false;
   double low1  = iLow(Symbol(), EntryTF_Minutes, 1);
   double high1 = iHigh(Symbol(), EntryTF_Minutes, 1);
   return (low1 <= g_buyOBHigh && high1 >= g_buyOBLow);
}

bool OrderBlockSellPass()
{
   if(!UseOrderBlockFilter) return true;
   if(!g_hasSellOB) return false;
   double low1  = iLow(Symbol(), EntryTF_Minutes, 1);
   double high1 = iHigh(Symbol(), EntryTF_Minutes, 1);
   return (low1 <= g_sellOBHigh && high1 >= g_sellOBLow);
}

//+------------------------------------------------------------------+
//| Ouverture de positions                                            |
//+------------------------------------------------------------------+
void TryOpenBuy()
{
   if(!TrendIsBullish())        return;
   if(!RSIIsBullish())          return;
   if(!RetestBuyPass())         return;
   if(!LiquiditySweepBuyPass()) return;
   if(!OrderBlockBuyPass())     return;
   if(!VolumeFilterPass())      return;
   if(!IsVolatilitySufficient()) return;

   double atr   = GetATR();
   double slDist = atr * SL_ATR_Mult;
   double tpDist = atr * TP_ATR_Mult;
   if(slDist <= 0.0 || tpDist <= 0.0) return;
   if((tpDist / slDist) < 2.0) return;

   double lots = CalculateLotByRisk(slDist);
   if(lots <= 0.0) return;

   double entry = Ask;
   double sl    = NormalizeDouble(entry - slDist, _Digits);
   double tp    = NormalizeDouble(entry + tpDist, _Digits);

   int ticket = OrderSend(Symbol(), OP_BUY, lots, entry,
                          3, sl, tp,
                          PairComment + " Buy", MagicNumber, 0, clrLime);
   if(ticket > 0)
      g_buySignalUsed = true;
   else
      Print("OrderSend Buy error: ", GetLastError());
}

void TryOpenSell()
{
   if(!TrendIsBearish())        return;
   if(!RSIIsBearish())          return;
   if(!RetestSellPass())        return;
   if(!LiquiditySweepSellPass()) return;
   if(!OrderBlockSellPass())    return;
   if(!VolumeFilterPass())      return;
   if(!IsVolatilitySufficient()) return;

   double atr   = GetATR();
   double slDist = atr * SL_ATR_Mult;
   double tpDist = atr * TP_ATR_Mult;
   if(slDist <= 0.0 || tpDist <= 0.0) return;
   if((tpDist / slDist) < 2.0) return;

   double lots = CalculateLotByRisk(slDist);
   if(lots <= 0.0) return;

   double entry = Bid;
   double sl    = NormalizeDouble(entry + slDist, _Digits);
   double tp    = NormalizeDouble(entry - tpDist, _Digits);

   int ticket = OrderSend(Symbol(), OP_SELL, lots, entry,
                          3, sl, tp,
                          PairComment + " Sell", MagicNumber, 0, clrRed);
   if(ticket > 0)
      g_sellSignalUsed = true;
   else
      Print("OrderSend Sell error: ", GetLastError());
}

//+------------------------------------------------------------------+
//| Gestion des positions ouvertes (BE + trailing)                   |
//+------------------------------------------------------------------+
void ManageOpenPositions()
{
   double atr = GetATR();
   if(atr <= 0.0) return;

   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol())           continue;
      if(OrderMagicNumber() != MagicNumber)   continue;

      int    type  = OrderType();
      double entry = OrderOpenPrice();
      double sl    = OrderStopLoss();
      double tp    = OrderTakeProfit();

      if(type == OP_BUY)
      {
         if(sl <= 0.0) continue;
         double riskDist  = entry - sl;
         if(riskDist <= 0.0) continue;
         double oneRPrice = entry + riskDist;

         if(UseBreakEven && Bid >= oneRPrice && sl < entry)
         {
            OrderModify(OrderTicket(), entry, entry, tp, 0, clrYellow);
            sl = entry;
         }
         if(UseTrailing && Bid >= oneRPrice)
         {
            double newSL = NormalizeDouble(Bid - atr * TrailATRMult, _Digits);
            if(newSL < entry) newSL = entry;
            if(newSL > sl && newSL < Bid)
               OrderModify(OrderTicket(), entry, newSL, tp, 0, clrYellow);
         }
      }
      else if(type == OP_SELL)
      {
         if(sl <= 0.0) continue;
         double riskDist  = sl - entry;
         if(riskDist <= 0.0) continue;
         double oneRPrice = entry - riskDist;

         if(UseBreakEven && Ask <= oneRPrice && sl > entry)
         {
            OrderModify(OrderTicket(), entry, entry, tp, 0, clrYellow);
            sl = entry;
         }
         if(UseTrailing && Ask <= oneRPrice)
         {
            double newSL = NormalizeDouble(Ask + atr * TrailATRMult, _Digits);
            if(newSL > entry) newSL = entry;
            if((newSL < sl || sl <= 0.0) && newSL > Ask)
               OrderModify(OrderTicket(), entry, newSL, tp, 0, clrYellow);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Dashboard visuel (Comment)                                        |
//+------------------------------------------------------------------+
void ShowDashboard()
{
   double atr  = GetATR();
   double fast = iMA(Symbol(), TrendTF_Minutes, FastEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slow = iMA(Symbol(), TrendTF_Minutes, SlowEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double rsi  = iRSI(Symbol(), MainTF_Minutes, RSIPeriod, PRICE_CLOSE, 1);
   double spread = GetSpreadPoints();

   double equity = AccountEquity();
   double dd = 0.0;
   if(g_dayStartEquity > 0.0)
      dd = ((g_dayStartEquity - equity) / g_dayStartEquity) * 100.0;

   string trend      = (fast > slow) ? "BULLISH ▲" : (fast < slow) ? "BEARISH ▼" : "NEUTRAL";
   string sesStatus  = IsTradingSession() ? "ACTIVE" : "CLOSED";
   string newsStatus = (UseManualNewsFilter && IsInNewsPauseWindow()) ? "PAUSED" : "OK";
   string spStatus   = (spread > MaxSpreadPoints) ? "HIGH" : "OK";
   string ddStatus   = IsDailyDrawdownExceeded() ? "LIMIT HIT" : "OK";

   string bosInfo = "";
   if(g_buyBreakLevel > 0.0 && !g_buySignalUsed)
      bosInfo += " BUY@" + DoubleToString(g_buyBreakLevel, _Digits);
   if(g_sellBreakLevel > 0.0 && !g_sellSignalUsed)
      bosInfo += " SELL@" + DoubleToString(g_sellBreakLevel, _Digits);
   if(bosInfo == "") bosInfo = " none";

   string s = "";
   s += "╔══════════════════════════════╗\n";
   s += "║  XAUUSD ALGO ROBOT v1.00 MT4 ║\n";
   s += "╚══════════════════════════════╝\n";
   s += "──────────────────────────────\n";
   s += "  Session   : " + sesStatus + "\n";
   s += "  News      : " + newsStatus + "\n";
   s += "  Spread    : " + DoubleToString(spread, 1) + " pts [" + spStatus + "]\n";
   s += "  DD today  : " + DoubleToString(MathMax(0.0, dd), 2) + "% [" + ddStatus + "]\n";
   s += "──────────────────────────────\n";
   s += "  Trend(H1) : " + trend + "\n";
   s += "  EMA50     : " + DoubleToString(fast, _Digits) + "\n";
   s += "  EMA200    : " + DoubleToString(slow, _Digits) + "\n";
   s += "  RSI(M15)  : " + DoubleToString(rsi, 2) + "\n";
   s += "  ATR(M15)  : " + DoubleToString(atr / _Point, 1) + " pts\n";
   s += "──────────────────────────────\n";
   s += "  BOS:" + bosInfo + "\n";
   s += "──────────────────────────────\n";
   s += "  Trades    : " + IntegerToString(CountOpenPositionsForEA()) +
        " / " + IntegerToString(MaxSimultaneousTrades) + "\n";
   s += "  Equity    : " + DoubleToString(equity, 2) + " " +
        AccountCurrency() + "\n";
   s += "──────────────────────────────\n";

   Comment(s);
}

//+------------------------------------------------------------------+
//| Filtre global avant ouverture                                     |
//+------------------------------------------------------------------+
bool GlobalFiltersPass()
{
   if(!IsTradingSession())        return false;
   if(IsInNewsPauseWindow())      return false;
   if(GetSpreadPoints() > MaxSpreadPoints) return false;
   if(IsDailyDrawdownExceeded())  return false;
   return true;
}

//+------------------------------------------------------------------+
//| Fonctions MT4 obligatoires                                        |
//+------------------------------------------------------------------+
int OnInit()
{
   UpdateDailyEquityAnchor();
   Print("XAUUSD Algo Robot MT4 initialisé – Magic: ", MagicNumber);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   Comment("");
}

void OnTick()
{
   ManageOpenPositions();
   UpdateBOSSignals();
   ShowDashboard();

   // Logique d'entrée exécutée une fois par nouvelle bougie M5
   datetime m5Bar = iTime(Symbol(), EntryTF_Minutes, 1);
   if(m5Bar == 0 || m5Bar == g_lastM5BarTime)
      return;
   g_lastM5BarTime = m5Bar;

   if(!GlobalFiltersPass())
      return;

   if(CountOpenPositionsForEA() >= MaxSimultaneousTrades)
      return;

   TryOpenBuy();

   if(CountOpenPositionsForEA() >= MaxSimultaneousTrades)
      return;

   TryOpenSell();
}
