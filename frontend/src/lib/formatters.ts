/**
 * MarketMind Institutional Financial & Date Formatters
 * Specialized for the Indian Equities Market (NSE / BSE / NIFTY 50)
 */

/**
 * Formats a number in Indian Rupee format (e.g., ₹1,23,456.78)
 */
export function formatINR(
  val: number | null | undefined,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
    signDisplay?: 'always' | 'auto' | 'never';
  }
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '₹--';
  }

  const { showDecimals = true, compact = false, signDisplay = 'auto' } = options || {};

  if (compact) {
    return formatCompactINR(val);
  }

  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absVal);

  if (val < 0) {
    return `-${formatted}`;
  }
  if (signDisplay === 'always' && val > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Compact Indian notation (e.g. ₹1.45 Cr, ₹32.80 L, ₹45.2 K)
 */
export function formatCompactINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹--';

  const abs = Math.abs(val);
  const prefix = val < 0 ? '-₹' : '₹';

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    return `${prefix}${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    // 1 Lakh = 100,000
    return `${prefix}${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${prefix}${(abs / 1000).toFixed(1)} K`;
  }
  return `${prefix}${abs.toFixed(2)}`;
}

/**
 * Formats raw volume into Lakhs / Crores string (e.g. 1.25 Cr, 45.2 L)
 */
export function formatVolume(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const abs = Math.abs(val);

  if (abs >= 10000000) {
    return `${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${(abs / 1000).toFixed(1)} K`;
  }
  return new Intl.NumberFormat('en-IN').format(Math.round(val));
}

/**
 * Formats percentage change with explicit sign (+ / -)
 */
export function formatPercent(
  val: number | null | undefined,
  options?: { showPlus?: boolean; decimals?: number }
): string {
  if (val === null || val === undefined || isNaN(val)) return '--%';

  const { showPlus = true, decimals = 2 } = options || {};
  const sign = val > 0 && showPlus ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

/**
 * Returns directional glyph and CSS classes
 */
export function getDeltaMeta(val: number | null | undefined) {
  if (val === null || val === undefined || isNaN(val) || val === 0) {
    return {
      glyph: '•',
      sign: '',
      colorClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10 border-slate-500/20',
      badgeClass: 'text-slate-300 bg-slate-800/80 border-slate-700/60',
    };
  }

  if (val > 0) {
    return {
      glyph: '▲',
      sign: '+',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    };
  }

  return {
    glyph: '▼',
    sign: '-',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
    badgeClass: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
  };
}

/**
 * Formats date into standard Indian Market time (IST)
 */
export function formatIST(
  dateInput?: string | Date | number | null,
  format: 'time' | 'date' | 'full' | 'short' = 'full'
): string {
  if (!dateInput) return '-- IST';

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  if (format === 'time') {
    return `${d.toLocaleTimeString('en-GB', timeOptions)} IST`;
  }
  if (format === 'date') {
    return d.toLocaleDateString('en-GB', dateOptions);
  }
  if (format === 'short') {
    return `${d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })} IST`;
  }

  return `${d.toLocaleDateString('en-GB', dateOptions)} • ${d.toLocaleTimeString('en-GB', timeOptions)} IST`;
}

export type MarketSession = 'PRE_OPEN' | 'REGULAR' | 'POST_CLOSE' | 'CLOSED';

export interface MarketSessionInfo {
  session: MarketSession;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

/**
 * Calculates current NSE/BSE Market Session State in IST
 */
export function getMarketSessionInfo(testDate?: Date): MarketSessionInfo {
  const now = testDate || new Date();

  // Convert to IST
  const istStr = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const [hoursStr, minsStr] = istStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minsStr, 10);
  const totalMinutes = hours * 60 + minutes;

  // Day of week in IST
  const dayStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
  const isWeekend = dayStr === 'Sat' || dayStr === 'Sun';

  if (isWeekend) {
    return {
      session: 'CLOSED',
      label: 'MARKET CLOSED',
      badgeClass: 'text-slate-400 bg-slate-900/60 border-slate-700/50',
      dotClass: 'bg-slate-500',
      description: 'Weekend • NSE & BSE reopens Monday 09:00 IST',
    };
  }

  // Pre-Open: 09:00 - 09:15 IST (540 - 555 mins)
  if (totalMinutes >= 540 && totalMinutes < 555) {
    return {
      session: 'PRE_OPEN',
      label: 'PRE-OPEN SESSION',
      badgeClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      dotClass: 'bg-amber-400 animate-ping',
      description: 'Pre-market order matching & price discovery (09:00 - 09:15 IST)',
    };
  }

  // Regular Hours: 09:15 - 15:30 IST (555 - 930 mins)
  if (totalMinutes >= 555 && totalMinutes < 930) {
    return {
      session: 'REGULAR',
      label: 'MARKET OPEN',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      dotClass: 'bg-emerald-400 animate-pulse',
      description: 'Live continuous trading session (09:15 - 15:30 IST)',
    };
  }

  // Post-Close: 15:30 - 16:00 IST (930 - 960 mins)
  if (totalMinutes >= 930 && totalMinutes < 960) {
    return {
      session: 'POST_CLOSE',
      label: 'POST-CLOSE SESSION',
      badgeClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      dotClass: 'bg-cyan-400',
      description: 'Post-market closing price determination (15:30 - 16:00 IST)',
    };
  }

  // Overnight / Off-hours
  return {
    session: 'CLOSED',
    label: 'MARKET CLOSED',
    badgeClass: 'text-slate-400 bg-slate-900/60 border-slate-700/50',
    dotClass: 'bg-slate-500',
    description: 'Trading halted • Resumes tomorrow at 09:00 IST',
  };
}
