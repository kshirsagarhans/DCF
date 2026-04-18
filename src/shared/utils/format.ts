export function formatCurrency(
  value: number,
  currency: string,
  abbreviate = false,
  indianFormat = false
): string {
  if (isNaN(value)) return '-';

  if (abbreviate) {
    const abs = Math.abs(value);
    let suffix = '';
    let val = abs;

    if (abs >= 1e9) {
      val = abs / 1e9;
      suffix = 'B';
    } else if (abs >= 1e6) {
      val = abs / 1e6;
      suffix = 'M';
    } else if (abs >= 1e3) {
      val = abs / 1e3;
      suffix = 'k';
    }

    const symbol = getCurrencySymbol(currency);
    const sign = value < 0 ? '−' : '';
    const numPart = val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    return `${sign}${symbol}${numPart}${suffix}`;
  }

  // Exact formatting
  let locales = 'en-US';
  if (currency === 'INR' && indianFormat) {
    locales = 'en-IN';
  }

  // Guard: currency must be a valid 3-letter ISO 4217 code, otherwise fallback to USD
  const safeCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD';

  try {
    const formatter = new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const parts = formatter.formatToParts(Math.abs(value));
    const numString = parts.map(p => p.value).join('');
    return value < 0 ? `−${numString}` : numString;
  } catch {
    // Absolute fallback: format as plain number with symbol
    const symbol = getCurrencySymbol(currency);
    const numPart = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${value < 0 ? '−' : ''}${symbol}${numPart}`;
  }
}

export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value)) return '-';
  const sign = value < 0 ? '−' : '';
  const numPart = Math.abs(value).toFixed(decimals);
  return `${sign}${numPart}%`;
}

export function formatMultiple(value: number, decimals = 1): string {
  if (isNaN(value)) return '-';
  return `${value.toFixed(decimals)}x`;
}

export function formatNumber(value: number, decimals = 0): string {
  if (isNaN(value)) return '-';
  const sign = value < 0 ? '−' : '';
  const numPart = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${sign}${numPart}`;
}

function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    CHF: 'CHF',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$'
  };
  return map[currency] || (currency || '$');
}
