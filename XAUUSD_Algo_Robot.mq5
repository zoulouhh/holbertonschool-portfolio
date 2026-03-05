#property strict
#property description "XAUUSD multi-timeframe EA with BOS/retest, risk management, and safety filters"
#property version   "1.00"

#include <Trade/Trade.mqh>

CTrade trade;

input ulong   InpMagicNumber              = 20260305;

input ENUM_TIMEFRAMES InpTrendTF          = PERIOD_H1;
input ENUM_TIMEFRAMES InpMainTF           = PERIOD_M15;
input ENUM_TIMEFRAMES InpEntryTF          = PERIOD_M5;

input int     InpFastEMA                  = 50;
input int     InpSlowEMA                  = 200;
input int     InpRSIPeriod                = 14;
input int     InpATRPeriod                = 14;

input double  InpRiskPercent              = 1.0;
input double  InpSL_ATR_Mult              = 1.5;
input double  InpTP_ATR_Mult              = 3.0;

input bool    InpUseBreakEven             = true;
input bool    InpUseTrailing              = true;
input double  InpTrailATRMult             = 1.0;

input string  InpLondonStartGMT           = "08:00";
input string  InpLondonEndGMT             = "11:30";
input string  InpNewYorkStartGMT          = "13:30";
input string  InpNewYorkEndGMT            = "17:00";

input int     InpMaxSpreadPoints          = 30;
input double  InpMinATRPoints             = 80.0;
input int     InpMaxSimultaneousTrades    = 2;
input double  InpMaxDailyDrawdownPercent  = 10.0;

input int     InpBOSLookbackBars          = 20;
input int     InpRetestTolerancePoints    = 50;

input bool    InpUseNewsFilter            = true;
input int     InpNewsPauseBeforeMinutes   = 30;
input int     InpNewsPauseAfterMinutes    = 30;

input bool    InpUseLiquiditySweepFilter  = false;
input bool    InpUseOrderBlockFilter      = false;
input bool    InpUseVolumeFilter          = false;
input int     InpVolumeLookbackBars       = 20;

int      g_fastEMAHandle = INVALID_HANDLE;
int      g_slowEMAHandle = INVALID_HANDLE;
int      g_rsiHandle     = INVALID_HANDLE;
int      g_atrHandle     = INVALID_HANDLE;

datetime g_lastM5BarTime  = 0;
datetime g_lastM15BarTime = 0;

double   g_buyBreakLevel = 0.0;
double   g_sellBreakLevel = 0.0;
datetime g_buyBOSTime = 0;
datetime g_sellBOSTime = 0;
bool     g_buySignalUsed = false;
bool     g_sellSignalUsed = false;

double   g_buyOBHigh = 0.0;
double   g_buyOBLow = 0.0;
bool     g_hasBuyOB = false;

double   g_sellOBHigh = 0.0;
double   g_sellOBLow = 0.0;
bool     g_hasSellOB = false;

int      g_currentDayOfYear = -1;
double   g_dayStartEquity = 0.0;

bool GetIndicatorValue(const int handle, const int shift, double &value)
{
   if(handle == INVALID_HANDLE)
      return false;

   double buffer[];
   if(CopyBuffer(handle, 0, shift, 1, buffer) != 1)
      return false;

   value = buffer[0];
   return true;
}

int ParseTimeToMinutes(const string hhmm)
{
   string parts[];
   int n = StringSplit(hhmm, ':', parts);
   if(n != 2)
      return -1;

   int hh = (int)StringToInteger(parts[0]);
   int mm = (int)StringToInteger(parts[1]);
   if(hh < 0 || hh > 23 || mm < 0 || mm > 59)
      return -1;

   return hh * 60 + mm;
}

bool IsMinutesInSession(const int current, const int start, const int end)
{
   if(start < 0 || end < 0)
      return false;

   if(start <= end)
      return (current >= start && current <= end);

   return (current >= start || current <= end);
}

bool IsTradingSession()
{
   datetime gmtNow = TimeGMT();
   MqlDateTime t;
   TimeToStruct(gmtNow, t);
   int currentMin = t.hour * 60 + t.min;

   int londonStart = ParseTimeToMinutes(InpLondonStartGMT);
   int londonEnd   = ParseTimeToMinutes(InpLondonEndGMT);
   int nyStart     = ParseTimeToMinutes(InpNewYorkStartGMT);
   int nyEnd       = ParseTimeToMinutes(InpNewYorkEndGMT);

   bool inLondon = IsMinutesInSession(currentMin, londonStart, londonEnd);
   bool inNY     = IsMinutesInSession(currentMin, nyStart, nyEnd);

   return (inLondon || inNY);
}

bool ContainsKeyword(const string haystackUpper, const string needleUpper)
{
   return (StringFind(haystackUpper, needleUpper) >= 0);
}

bool IsMajorNewsName(const string name)
{
   string upper = StringToUpper(name);

   if(ContainsKeyword(upper, "FED") ||
      ContainsKeyword(upper, "FOMC") ||
      ContainsKeyword(upper, "NFP") ||
      ContainsKeyword(upper, "NONFARM") ||
      ContainsKeyword(upper, "CPI") ||
      ContainsKeyword(upper, "INFLATION") ||
      ContainsKeyword(upper, "INTEREST RATE"))
   {
      return true;
   }

   return false;
}

bool IsInNewsPauseWindow()
{
   if(!InpUseNewsFilter)
      return false;

   datetime nowGmt = TimeGMT();
   datetime fromTime = nowGmt - (InpNewsPauseBeforeMinutes * 60);
   datetime toTime   = nowGmt + (InpNewsPauseAfterMinutes * 60);

   MqlCalendarValue values[];
   int count = CalendarValueHistory(values, fromTime, toTime);
   if(count <= 0)
      return false;

   for(int i = 0; i < count; i++)
   {
      MqlCalendarEvent event;
      if(!CalendarEventById(values[i].event_id, event))
         continue;

      if(event.importance != CALENDAR_IMPORTANCE_HIGH)
         continue;

      // Focus on major USD-linked macro events for XAUUSD.
      if(event.currency != "USD")
         continue;

      if(IsMajorNewsName(event.name))
         return true;
   }

   return false;
}

double GetSpreadPoints()
{
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(ask <= 0.0 || bid <= 0.0)
      return 999999.0;

   return (ask - bid) / _Point;
}

int CountOpenPositionsForEA()
{
   int count = 0;
   int total = PositionsTotal();

   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;

      if(!PositionSelectByTicket(ticket))
         continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      long magic = PositionGetInteger(POSITION_MAGIC);
      if(symbol == _Symbol && (ulong)magic == InpMagicNumber)
         count++;
   }

   return count;
}

void UpdateDailyEquityAnchor()
{
   datetime nowGmt = TimeGMT();
   MqlDateTime t;
   TimeToStruct(nowGmt, t);

   if(g_currentDayOfYear != t.day_of_year)
   {
      g_currentDayOfYear = t.day_of_year;
      g_dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   }
}

bool IsDailyDrawdownExceeded()
{
   UpdateDailyEquityAnchor();

   if(g_dayStartEquity <= 0.0)
      return false;

   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double dd = ((g_dayStartEquity - equity) / g_dayStartEquity) * 100.0;

   return (dd >= InpMaxDailyDrawdownPercent);
}

double GetRecentHigh(const ENUM_TIMEFRAMES tf, const int startShift, const int count)
{
   double maxHigh = -DBL_MAX;
   for(int i = startShift; i < startShift + count; i++)
   {
      double h = iHigh(_Symbol, tf, i);
      if(h > maxHigh)
         maxHigh = h;
   }
   return maxHigh;
}

double GetRecentLow(const ENUM_TIMEFRAMES tf, const int startShift, const int count)
{
   double minLow = DBL_MAX;
   for(int i = startShift; i < startShift + count; i++)
   {
      double l = iLow(_Symbol, tf, i);
      if(l < minLow)
         minLow = l;
   }
   return minLow;
}

void FindOrderBlockForBuy()
{
   g_hasBuyOB = false;
   for(int i = 2; i <= 20; i++)
   {
      double o = iOpen(_Symbol, InpMainTF, i);
      double c = iClose(_Symbol, InpMainTF, i);
      if(c < o)
      {
         g_buyOBHigh = iHigh(_Symbol, InpMainTF, i);
         g_buyOBLow  = iLow(_Symbol, InpMainTF, i);
         g_hasBuyOB = true;
         return;
      }
   }
}

void FindOrderBlockForSell()
{
   g_hasSellOB = false;
   for(int i = 2; i <= 20; i++)
   {
      double o = iOpen(_Symbol, InpMainTF, i);
      double c = iClose(_Symbol, InpMainTF, i);
      if(c > o)
      {
         g_sellOBHigh = iHigh(_Symbol, InpMainTF, i);
         g_sellOBLow  = iLow(_Symbol, InpMainTF, i);
         g_hasSellOB = true;
         return;
      }
   }
}

void UpdateBOSSignals()
{
   datetime m15BarTime = iTime(_Symbol, InpMainTF, 1);
   if(m15BarTime == 0 || m15BarTime == g_lastM15BarTime)
      return;

   g_lastM15BarTime = m15BarTime;

   double close1 = iClose(_Symbol, InpMainTF, 1);

   double recentHigh = GetRecentHigh(InpMainTF, 2, InpBOSLookbackBars);
   double recentLow  = GetRecentLow(InpMainTF, 2, InpBOSLookbackBars);

   if(close1 > recentHigh)
   {
      g_buyBreakLevel = recentHigh;
      g_buyBOSTime = m15BarTime;
      g_buySignalUsed = false;
      if(InpUseOrderBlockFilter)
         FindOrderBlockForBuy();
   }

   if(close1 < recentLow)
   {
      g_sellBreakLevel = recentLow;
      g_sellBOSTime = m15BarTime;
      g_sellSignalUsed = false;
      if(InpUseOrderBlockFilter)
         FindOrderBlockForSell();
   }
}

bool TrendIsBullish()
{
   double fast = 0.0;
   double slow = 0.0;
   if(!GetIndicatorValue(g_fastEMAHandle, 1, fast))
      return false;
   if(!GetIndicatorValue(g_slowEMAHandle, 1, slow))
      return false;
   return (fast > slow);
}

bool TrendIsBearish()
{
   double fast = 0.0;
   double slow = 0.0;
   if(!GetIndicatorValue(g_fastEMAHandle, 1, fast))
      return false;
   if(!GetIndicatorValue(g_slowEMAHandle, 1, slow))
      return false;
   return (fast < slow);
}

bool RSIIsBullish()
{
   double rsi = 0.0;
   if(!GetIndicatorValue(g_rsiHandle, 1, rsi))
      return false;
   return (rsi > 55.0);
}

bool RSIIsBearish()
{
   double rsi = 0.0;
   if(!GetIndicatorValue(g_rsiHandle, 1, rsi))
      return false;
   return (rsi < 45.0);
}

bool GetATR(double &atr)
{
   return GetIndicatorValue(g_atrHandle, 1, atr);
}

bool IsVolatilitySufficient(double &atr)
{
   if(!GetATR(atr))
      return false;

   double atrPoints = atr / _Point;
   return (atrPoints >= InpMinATRPoints);
}

bool VolumeFilterPass()
{
   if(!InpUseVolumeFilter)
      return true;

   long volNow = (long)iVolume(_Symbol, InpEntryTF, 1);
   if(volNow <= 0)
      return false;

   double avg = 0.0;
   int valid = 0;
   for(int i = 2; i < 2 + InpVolumeLookbackBars; i++)
   {
      long v = (long)iVolume(_Symbol, InpEntryTF, i);
      if(v > 0)
      {
         avg += (double)v;
         valid++;
      }
   }

   if(valid == 0)
      return false;

   avg /= valid;
   return ((double)volNow >= avg);
}

bool LiquiditySweepBuyPass()
{
   if(!InpUseLiquiditySweepFilter)
      return true;

   double low1 = iLow(_Symbol, InpEntryTF, 1);
   double close1 = iClose(_Symbol, InpEntryTF, 1);
   double open1 = iOpen(_Symbol, InpEntryTF, 1);
   double body = MathAbs(close1 - open1);
   double wick = MathMin(open1, close1) - low1;

   double prevLow = GetRecentLow(InpEntryTF, 2, 10);
   if(low1 >= prevLow)
      return false;

   if(body <= 0.0)
      return false;

   return (wick >= body);
}

bool LiquiditySweepSellPass()
{
   if(!InpUseLiquiditySweepFilter)
      return true;

   double high1 = iHigh(_Symbol, InpEntryTF, 1);
   double close1 = iClose(_Symbol, InpEntryTF, 1);
   double open1 = iOpen(_Symbol, InpEntryTF, 1);
   double body = MathAbs(close1 - open1);
   double wick = high1 - MathMax(open1, close1);

   double prevHigh = GetRecentHigh(InpEntryTF, 2, 10);
   if(high1 <= prevHigh)
      return false;

   if(body <= 0.0)
      return false;

   return (wick >= body);
}

bool OrderBlockBuyPass()
{
   if(!InpUseOrderBlockFilter)
      return true;

   if(!g_hasBuyOB)
      return false;

   double low1 = iLow(_Symbol, InpEntryTF, 1);
   double high1 = iHigh(_Symbol, InpEntryTF, 1);
   return (low1 <= g_buyOBHigh && high1 >= g_buyOBLow);
}

bool OrderBlockSellPass()
{
   if(!InpUseOrderBlockFilter)
      return true;

   if(!g_hasSellOB)
      return false;

   double low1 = iLow(_Symbol, InpEntryTF, 1);
   double high1 = iHigh(_Symbol, InpEntryTF, 1);
   return (low1 <= g_sellOBHigh && high1 >= g_sellOBLow);
}

double NormalizeLots(const double lotsRaw)
{
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   if(step <= 0.0)
      return 0.0;

   double lots = MathMax(minLot, MathMin(maxLot, lotsRaw));
   lots = MathFloor(lots / step) * step;

   int lotDigits = 2;
   if(step > 0.0)
      lotDigits = (int)MathRound(-MathLog10(step));

   return NormalizeDouble(lots, MathMax(0, lotDigits));
}

double CalculateLotSizeByRisk(const double slDistancePrice)
{
   if(slDistancePrice <= 0.0)
      return 0.0;

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney = balance * (InpRiskPercent / 100.0);
   if(riskMoney <= 0.0)
      return 0.0;

   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);

   if(tickValue <= 0.0 || tickSize <= 0.0)
      return 0.0;

   double lossPerLot = (slDistancePrice / tickSize) * tickValue;
   if(lossPerLot <= 0.0)
      return 0.0;

   double rawLots = riskMoney / lossPerLot;
   return NormalizeLots(rawLots);
}

bool RetestBuyPass()
{
   if(g_buyBreakLevel <= 0.0 || g_buySignalUsed)
      return false;

   if(g_buyBOSTime <= 0)
      return false;

   double tol = InpRetestTolerancePoints * _Point;
   double low1 = iLow(_Symbol, InpEntryTF, 1);
   double close1 = iClose(_Symbol, InpEntryTF, 1);

   bool retest = (low1 <= (g_buyBreakLevel + tol) && close1 > g_buyBreakLevel);
   return retest;
}

bool RetestSellPass()
{
   if(g_sellBreakLevel <= 0.0 || g_sellSignalUsed)
      return false;

   if(g_sellBOSTime <= 0)
      return false;

   double tol = InpRetestTolerancePoints * _Point;
   double high1 = iHigh(_Symbol, InpEntryTF, 1);
   double close1 = iClose(_Symbol, InpEntryTF, 1);

   bool retest = (high1 >= (g_sellBreakLevel - tol) && close1 < g_sellBreakLevel);
   return retest;
}

void ManageOpenPositions()
{
   double atr = 0.0;
   if(!GetATR(atr) || atr <= 0.0)
      return;

   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;

      if(!PositionSelectByTicket(ticket))
         continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      long magic = PositionGetInteger(POSITION_MAGIC);
      if(symbol != _Symbol || (ulong)magic != InpMagicNumber)
         continue;

      long type = PositionGetInteger(POSITION_TYPE);
      double entry = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      if(type == POSITION_TYPE_BUY)
      {
         if(sl <= 0.0)
            continue;

         double riskDist = entry - sl;
         if(riskDist <= 0.0)
            continue;

         double oneRPrice = entry + riskDist;

         if(InpUseBreakEven && bid >= oneRPrice && sl < entry)
         {
            trade.PositionModify(_Symbol, entry, tp);
            sl = entry;
         }

         if(InpUseTrailing && bid >= oneRPrice)
         {
            double newSL = bid - (atr * InpTrailATRMult);
            if(newSL > sl && newSL < bid)
            {
               if(newSL < entry)
                  newSL = entry;
               trade.PositionModify(_Symbol, newSL, tp);
            }
         }
      }
      else if(type == POSITION_TYPE_SELL)
      {
         if(sl <= 0.0)
            continue;

         double riskDist = sl - entry;
         if(riskDist <= 0.0)
            continue;

         double oneRPrice = entry - riskDist;

         if(InpUseBreakEven && ask <= oneRPrice && sl > entry)
         {
            trade.PositionModify(_Symbol, entry, tp);
            sl = entry;
         }

         if(InpUseTrailing && ask <= oneRPrice)
         {
            double newSL = ask + (atr * InpTrailATRMult);
            if((newSL < sl || sl <= 0.0) && newSL > ask)
            {
               if(newSL > entry)
                  newSL = entry;
               trade.PositionModify(_Symbol, newSL, tp);
            }
         }
      }
   }
}

void TryOpenBuy()
{
   if(!TrendIsBullish())
      return;
   if(!RSIIsBullish())
      return;
   if(!RetestBuyPass())
      return;
   if(!LiquiditySweepBuyPass())
      return;
   if(!OrderBlockBuyPass())
      return;
   if(!VolumeFilterPass())
      return;

   double atr = 0.0;
   if(!IsVolatilitySufficient(atr))
      return;

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   if(ask <= 0.0)
      return;

   double slDistance = atr * InpSL_ATR_Mult;
   double tpDistance = atr * InpTP_ATR_Mult;
   if(slDistance <= 0.0 || tpDistance <= 0.0)
      return;

   // Enforce a minimum RR of 1:2.
   if((tpDistance / slDistance) < 2.0)
      return;

   double volume = CalculateLotSizeByRisk(slDistance);
   if(volume <= 0.0)
      return;

   double sl = ask - slDistance;
   double tp = ask + tpDistance;

   trade.SetExpertMagicNumber(InpMagicNumber);
   bool ok = trade.Buy(volume, _Symbol, ask, sl, tp, "XAU BOS Retest Buy");
   if(ok)
      g_buySignalUsed = true;
}

void TryOpenSell()
{
   if(!TrendIsBearish())
      return;
   if(!RSIIsBearish())
      return;
   if(!RetestSellPass())
      return;
   if(!LiquiditySweepSellPass())
      return;
   if(!OrderBlockSellPass())
      return;
   if(!VolumeFilterPass())
      return;

   double atr = 0.0;
   if(!IsVolatilitySufficient(atr))
      return;

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(bid <= 0.0)
      return;

   double slDistance = atr * InpSL_ATR_Mult;
   double tpDistance = atr * InpTP_ATR_Mult;
   if(slDistance <= 0.0 || tpDistance <= 0.0)
      return;

   // Enforce a minimum RR of 1:2.
   if((tpDistance / slDistance) < 2.0)
      return;

   double volume = CalculateLotSizeByRisk(slDistance);
   if(volume <= 0.0)
      return;

   double sl = bid + slDistance;
   double tp = bid - tpDistance;

   trade.SetExpertMagicNumber(InpMagicNumber);
   bool ok = trade.Sell(volume, _Symbol, bid, sl, tp, "XAU BOS Retest Sell");
   if(ok)
      g_sellSignalUsed = true;
}

bool GlobalFiltersPass()
{
   if(!IsTradingSession())
      return false;

   if(IsInNewsPauseWindow())
      return false;

   if(GetSpreadPoints() > InpMaxSpreadPoints)
      return false;

   if(IsDailyDrawdownExceeded())
      return false;

   return true;
}

string FormatPrice(const double price)
{
   return DoubleToString(price, _Digits);
}

void ShowDashboard()
{
   double atr = 0.0;
   GetATR(atr);

   double fast = 0.0, slow = 0.0, rsi = 0.0;
   GetIndicatorValue(g_fastEMAHandle, 1, fast);
   GetIndicatorValue(g_slowEMAHandle, 1, slow);
   GetIndicatorValue(g_rsiHandle, 1, rsi);

   double spread = GetSpreadPoints();

   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double dd = 0.0;
   if(g_dayStartEquity > 0.0)
      dd = ((g_dayStartEquity - equity) / g_dayStartEquity) * 100.0;

   string trend = (fast > slow) ? "BULLISH ▲" : (fast < slow) ? "BEARISH ▼" : "NEUTRAL";

   string sessionStatus = IsTradingSession() ? "ACTIVE ✔" : "CLOSED ✘";

   string newsStatus = (InpUseNewsFilter && IsInNewsPauseWindow()) ? "PAUSED ⚠" : "OK ✔";

   string spreadStatus = (spread > InpMaxSpreadPoints) ? "HIGH ✘ " : "OK ✔ ";

   string ddStatus = IsDailyDrawdownExceeded() ? "LIMIT HIT ✘" : "OK ✔";

   string bosInfo = "";
   if(g_buyBreakLevel > 0.0 && !g_buySignalUsed)
      bosInfo += " BUY level " + FormatPrice(g_buyBreakLevel) + " (waiting retest)";
   if(g_sellBreakLevel > 0.0 && !g_sellSignalUsed)
      bosInfo += " SELL level " + FormatPrice(g_sellBreakLevel) + " (waiting retest)";
   if(bosInfo == "")
      bosInfo = " none pending";

   string separator = "─────────────────────────────────\n";

   string dashboard = "";
   dashboard += "╔══════════════════════════════╗\n";
   dashboard += "║   XAUUSD ALGO ROBOT v1.00    ║\n";
   dashboard += "╚══════════════════════════════╝\n";
   dashboard += separator;
   dashboard += "  Session   : " + sessionStatus + "\n";
   dashboard += "  News      : " + newsStatus + "\n";
   dashboard += "  Spread    : " + DoubleToString(spread, 1) + " pts  " + spreadStatus + "\n";
   dashboard += "  DD today  : " + DoubleToString(MathMax(0.0, dd), 2) + "% " + ddStatus + "\n";
   dashboard += separator;
   dashboard += "  Trend(H1) : " + trend + "\n";
   dashboard += "  EMA50     : " + FormatPrice(fast) + "\n";
   dashboard += "  EMA200    : " + FormatPrice(slow) + "\n";
   dashboard += "  RSI(M15)  : " + DoubleToString(rsi, 2) + "\n";
   dashboard += "  ATR(M15)  : " + DoubleToString(atr / _Point, 1) + " pts\n";
   dashboard += separator;
   dashboard += "  BOS signals:" + bosInfo + "\n";
   dashboard += separator;
   dashboard += "  Open trades: " + IntegerToString(CountOpenPositionsForEA()) +
                " / " + IntegerToString(InpMaxSimultaneousTrades) + "\n";
   dashboard += "  Equity     : " + DoubleToString(equity, 2) + " " +
                AccountInfoString(ACCOUNT_CURRENCY) + "\n";
   dashboard += separator;

   Comment(dashboard);
}

int OnInit()
{
   g_fastEMAHandle = iMA(_Symbol, InpTrendTF, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_slowEMAHandle = iMA(_Symbol, InpTrendTF, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_rsiHandle     = iRSI(_Symbol, InpMainTF, InpRSIPeriod, PRICE_CLOSE);
   g_atrHandle     = iATR(_Symbol, InpMainTF, InpATRPeriod);

   if(g_fastEMAHandle == INVALID_HANDLE ||
      g_slowEMAHandle == INVALID_HANDLE ||
      g_rsiHandle == INVALID_HANDLE ||
      g_atrHandle == INVALID_HANDLE)
   {
      Print("Failed to create indicator handles.");
      return INIT_FAILED;
   }

   UpdateDailyEquityAnchor();

   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   Comment("");
   if(g_fastEMAHandle != INVALID_HANDLE)
      IndicatorRelease(g_fastEMAHandle);
   if(g_slowEMAHandle != INVALID_HANDLE)
      IndicatorRelease(g_slowEMAHandle);
   if(g_rsiHandle != INVALID_HANDLE)
      IndicatorRelease(g_rsiHandle);
   if(g_atrHandle != INVALID_HANDLE)
      IndicatorRelease(g_atrHandle);
}

void OnTick()
{
   ManageOpenPositions();
   UpdateBOSSignals();
   ShowDashboard();

   datetime m5BarTime = iTime(_Symbol, InpEntryTF, 1);
   if(m5BarTime == 0 || m5BarTime == g_lastM5BarTime)
      return;

   g_lastM5BarTime = m5BarTime;

   if(!GlobalFiltersPass())
      return;

   if(CountOpenPositionsForEA() >= InpMaxSimultaneousTrades)
      return;

   TryOpenBuy();

   if(CountOpenPositionsForEA() >= InpMaxSimultaneousTrades)
      return;

   TryOpenSell();
}
