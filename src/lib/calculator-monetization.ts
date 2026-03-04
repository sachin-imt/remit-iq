export interface AffiliateLink {
  name: string;
  description: string;
  tag: string;
  url: string;
}

export interface CalculatorAffiliateConfig {
  heading: string;
  description: string;
  cta: string;
  links: AffiliateLink[];
}

export const AFFILIATE_CONFIG: Record<string, CalculatorAffiliateConfig> = {
  loan: {
    heading: "Compare Personal Loan Rates",
    description: "Find the lowest interest rates from top lenders. Pre-qualify without affecting your credit score.",
    cta: "Compare Rates",
    links: [
      { name: "SoFi", description: "From 5.99% APR", tag: "LOW RATES", url: "#sofi-affiliate" },
      { name: "LendingClub", description: "From 6.34% APR", tag: "FAST APPROVAL", url: "#lendingclub-affiliate" },
      { name: "Prosper", description: "From 6.99% APR", tag: "FLEXIBLE TERMS", url: "#prosper-affiliate" },
    ],
  },
  mortgage: {
    heading: "Compare Mortgage Rates Today",
    description: "Get personalized mortgage quotes from top lenders in minutes.",
    cta: "Get Free Quotes",
    links: [
      { name: "Rocket Mortgage", description: "Rates from 6.25%", tag: "MOST POPULAR", url: "#rocket-affiliate" },
      { name: "Better.com", description: "No commission", tag: "LOWEST FEES", url: "#better-affiliate" },
      { name: "LoanDepot", description: "Rates from 6.375%", tag: "FAST CLOSE", url: "#loandepot-affiliate" },
    ],
  },
  "compound-interest": {
    heading: "Start Investing Today",
    description: "Open a high-yield investment account and let compound interest work for you.",
    cta: "Start Investing",
    links: [
      { name: "Wealthfront", description: "5.0% APY savings", tag: "EDITOR PICK", url: "#wealthfront-affiliate" },
      { name: "Betterment", description: "Automated investing", tag: "BEGINNER FRIENDLY", url: "#betterment-affiliate" },
      { name: "Fidelity", description: "$0 commission trades", tag: "TRUSTED", url: "#fidelity-affiliate" },
    ],
  },
  retirement: {
    heading: "Open a Retirement Account",
    description: "It's never too early (or late) to start. Compare IRA and 401(k) providers.",
    cta: "Compare Accounts",
    links: [
      { name: "Vanguard", description: "Low-cost index funds", tag: "BEST VALUE", url: "#vanguard-affiliate" },
      { name: "Charles Schwab", description: "$0 account minimum", tag: "NO MINIMUMS", url: "#schwab-affiliate" },
      { name: "Fidelity", description: "0% expense ratio funds", tag: "LOWEST COST", url: "#fidelity-affiliate" },
    ],
  },
  "currency-converter": {
    heading: "Send Money Internationally",
    description: "Save up to 90% on international transfers compared to banks.",
    cta: "Compare Providers",
    links: [
      { name: "Wise", description: "Mid-market rate", tag: "BEST RATE", url: "#wise-affiliate" },
      { name: "Remitly", description: "First transfer free", tag: "PROMO", url: "#remitly-affiliate" },
      { name: "OFX", description: "No transfer fees", tag: "FEE FREE", url: "#ofx-affiliate" },
    ],
  },
};

export function saveEmailCapture(email: string, page: string): void {
  const emails = JSON.parse(localStorage.getItem("cv_emails") || "[]");
  emails.push({ email, date: new Date().toISOString(), page });
  localStorage.setItem("cv_emails", JSON.stringify(emails));
}

export function trackAffiliateClick(affiliate: string, page: string): void {
  const clicks = JSON.parse(localStorage.getItem("cv_clicks") || "[]");
  clicks.push({ affiliate, page, date: new Date().toISOString() });
  localStorage.setItem("cv_clicks", JSON.stringify(clicks));
}

export function hasModalBeenShown(): boolean {
  return localStorage.getItem("cv_modal_shown") === "true";
}

export function markModalShown(): void {
  localStorage.setItem("cv_modal_shown", "true");
}
