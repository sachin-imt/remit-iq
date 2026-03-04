export interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  symbol: string;
  fallbackRate: number; // vs USD
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$", fallbackRate: 1 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€", fallbackRate: 0.9205 },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", symbol: "£", fallbackRate: 0.7885 },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$", fallbackRate: 1.532 },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$", fallbackRate: 1.356 },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥", fallbackRate: 149.5 },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", symbol: "Fr", fallbackRate: 0.879 },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", symbol: "¥", fallbackRate: 7.245 },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", symbol: "₹", fallbackRate: 83.12 },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿", symbol: "NZ$", fallbackRate: 1.645 },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$", fallbackRate: 1.342 },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰", symbol: "HK$", fallbackRate: 7.823 },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷", symbol: "₩", fallbackRate: 1325.5 },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽", symbol: "$", fallbackRate: 17.15 },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", symbol: "R$", fallbackRate: 4.97 },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪", symbol: "kr", fallbackRate: 10.42 },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴", symbol: "kr", fallbackRate: 10.55 },
  { code: "DKK", name: "Danish Krone", flag: "🇩🇰", symbol: "kr", fallbackRate: 6.87 },
  { code: "PLN", name: "Polish Złoty", flag: "🇵🇱", symbol: "zł", fallbackRate: 4.02 },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", symbol: "฿", fallbackRate: 35.2 },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦", symbol: "R", fallbackRate: 18.65 },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷", symbol: "₺", fallbackRate: 30.25 },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪", symbol: "د.إ", fallbackRate: 3.6725 },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦", symbol: "﷼", fallbackRate: 3.75 },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", symbol: "₱", fallbackRate: 55.8 },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM", fallbackRate: 4.71 },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp", fallbackRate: 15650 },
  { code: "TWD", name: "Taiwan Dollar", flag: "🇹🇼", symbol: "NT$", fallbackRate: 31.5 },
  { code: "CZK", name: "Czech Koruna", flag: "🇨🇿", symbol: "Kč", fallbackRate: 22.75 },
  { code: "ILS", name: "Israeli Shekel", flag: "🇮🇱", symbol: "₪", fallbackRate: 3.68 },
  { code: "CLP", name: "Chilean Peso", flag: "🇨🇱", symbol: "$", fallbackRate: 880 },
  { code: "PKR", name: "Pakistani Rupee", flag: "🇵🇰", symbol: "₨", fallbackRate: 278 },
];

export const POPULAR_CURRENCIES = ["EUR", "GBP", "AUD", "JPY", "CAD", "CHF", "CNY", "INR"];

export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

export function formatCurrencyResult(amount: number, symbol: string): string {
  if (amount >= 1000000) {
    return symbol + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else if (amount >= 1) {
    return symbol + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    return symbol + amount.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
}
