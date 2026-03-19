/**
 * Corridor definitions for programmatic SEO pages.
 * Each corridor represents a country→India remittance route.
 */export interface Corridor {
  slug: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  flag: string;
  isoCode: string;           // ISO 3166-1 alpha-2 country code
  diaspora: string;          // approximate Indian diaspora population
  annualRemittance: string;  // annual remittance volume to India
  avgTransfer: string;       // typical transfer amount in local currency
  providers: string[];       // provider IDs available in this corridor
  faq: { q: string; a: string }[];
}

export const CORRIDORS: Corridor[] = [
  {
    slug: "usa",
    country: "United States",
    currencyCode: "USD",
    currencySymbol: "$",
    flag: "🇺🇸",
    isoCode: "US",
    diaspora: "4.4 million",
    annualRemittance: "$37.5 billion",
    avgTransfer: "$1,500",
    providers: ["wise", "remitly", "wu", "ofx", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from USA to India?", a: "Wise and Remitly consistently offer the best USD to INR exchange rates. For transfers over $1,000, Wise's mid-market rate with a small transparent fee is usually the cheapest option." },
      { q: "How long does a USD to INR transfer take?", a: "Most providers deliver funds within minutes to a few hours for bank deposits. Cash pickup can be instant through Western Union." },
      { q: "Are there limits on sending money from USA to India?", a: "Limits vary by provider. Wise allows up to $1 million per transfer, while Remitly has a $25,000 daily limit for verified users. India's Liberalised Remittance Scheme allows inflows without limit." },
      { q: "Do I need to pay tax on money sent to India from USA?", a: "Sending money is not a taxable event in the US. However, transfers over $15,000 may need a gift-tax filing (Form 709), though no tax is typically owed below the lifetime exemption." },
    ],
  },
  {
    slug: "uk",
    country: "United Kingdom",
    currencyCode: "GBP",
    currencySymbol: "£",
    flag: "🇬🇧",
    isoCode: "GB",
    diaspora: "1.8 million",
    annualRemittance: "$14.6 billion",
    avgTransfer: "£1,000",
    providers: ["wise", "remitly", "wu", "ofx", "instarem", "torfx"],
    faq: [
      { q: "What is the cheapest way to send money from UK to India?", a: "Wise typically offers the best GBP to INR rate, charging only a small transparent fee. Remitly often matches or beats on smaller transfers with zero-fee promotions." },
      { q: "How long does a GBP to INR transfer take?", a: "Wise and Remitly can deliver in minutes. TorFX and OFX usually take 1-2 business days." },
      { q: "Is there a limit on how much money I can send from UK to India?", a: "UK providers generally allow up to £250,000+ per transfer for verified accounts. India has no cap on inward remittances." },
      { q: "Do I need to pay tax on money sent to India from UK?", a: "There is no UK tax on sending money abroad. Gifts to Indian residents under ₹50,000 are also not taxable in India for the recipient." },
    ],
  },
  {
    slug: "uae",
    country: "United Arab Emirates",
    currencyCode: "AED",
    currencySymbol: "د.إ",
    flag: "🇦🇪",
    isoCode: "AE",
    diaspora: "3.5 million",
    annualRemittance: "$26 billion",
    avgTransfer: "AED 3,000",
    providers: ["wise", "remitly", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from UAE to India?", a: "Wise and Remitly offer competitive AED to INR rates. For large transfers, Wise's mid-market rate approach is usually cheapest. Exchange houses can be competitive for cash-based transfers." },
      { q: "How long does an AED to INR transfer take?", a: "Most transfers arrive within minutes to 24 hours. Western Union offers instant cash pickup." },
      { q: "Is remittance from UAE to India taxable?", a: "UAE has no income tax or remittance tax. In India, inward remittances are generally not taxable for the recipient under Section 10(43)." },
      { q: "What documents do I need to send money from UAE to India?", a: "You'll need a valid Emirates ID, passport, and proof of income. Some providers accept a residence visa as alternative identification." },
    ],
  },
  {
    slug: "canada",
    country: "Canada",
    currencyCode: "CAD",
    currencySymbol: "C$",
    flag: "🇨🇦",
    isoCode: "CA",
    diaspora: "1.8 million",
    annualRemittance: "$5.1 billion",
    avgTransfer: "$1,200",
    providers: ["wise", "remitly", "wu", "ofx", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Canada to India?", a: "Wise consistently offers the lowest total cost for CAD to INR transfers, especially for amounts over $1,000. Remitly offers zero-fee deals for new customers." },
      { q: "How long does a CAD to INR transfer take?", a: "Wise and Remitly deliver within minutes to hours. OFX typically takes 1-2 business days." },
      { q: "Are there limits on sending money from Canada to India?", a: "FINTRAC requires reporting for transfers over CAD $10,000, but there's no sending limit. Provider limits vary from $15,000 to $250,000+." },
      { q: "Do I pay Canadian tax on remittances to India?", a: "No. Sending money abroad is not a taxable event in Canada. However, large gifts may have implications under Indian tax law." },
    ],
  },
  {
    slug: "singapore",
    country: "Singapore",
    currencyCode: "SGD",
    currencySymbol: "S$",
    flag: "🇸🇬",
    isoCode: "SG",
    diaspora: "650,000",
    annualRemittance: "$8.9 billion",
    avgTransfer: "S$2,000",
    providers: ["wise", "remitly", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Singapore to India?", a: "Wise and Instarem (headquartered in Singapore) offer excellent SGD to INR rates. Instarem often has special promotions for the Singapore-India corridor." },
      { q: "How long does a SGD to INR transfer take?", a: "Most transfers arrive within minutes. Instarem and Wise process same-day." },
      { q: "Is there GST on remittance from Singapore?", a: "International money transfer services are zero-rated for GST purposes in Singapore." },
      { q: "Can I send money to an NRE account from Singapore?", a: "Yes, all major providers support transfers to NRE, NRO, and regular savings accounts in India." },
    ],
  },
  {
    slug: "australia",
    country: "Australia",
    currencyCode: "AUD",
    currencySymbol: "A$",
    flag: "🇦🇺",
    isoCode: "AU",
    diaspora: "780,000",
    annualRemittance: "$5 billion",
    avgTransfer: "A$2,000",
    providers: ["wise", "remitly", "wu", "ofx", "instarem", "torfx"],
    faq: [
      { q: "What is the cheapest way to send money from Australia to India?", a: "Wise offers the best AUD to INR rate with transparent fees. For large transfers ($5,000+), OFX and TorFX are also competitive with zero transfer fees." },
      { q: "How long does an AUD to INR transfer take?", a: "Wise and Remitly deliver in minutes. OFX and TorFX take 1-2 business days." },
      { q: "Is there a limit on how much money I can send from Australia to India?", a: "AUSTRAC requires reporting for transfers over AUD $10,000 but doesn't impose limits. Provider limits range from $50,000 to $250,000+." },
      { q: "Do I pay Australian tax on money sent to India?", a: "No. Sending money abroad is not taxable in Australia. Recipients in India are also exempt if it's a gift from a relative." },
    ],
  },
  {
    slug: "germany",
    country: "Germany",
    currencyCode: "EUR",
    currencySymbol: "€",
    flag: "🇩🇪",
    isoCode: "DE",
    diaspora: "160,000",
    annualRemittance: "$1.2 billion",
    avgTransfer: "€1,000",
    providers: ["wise", "remitly", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Germany to India?", a: "Wise offers the best EUR to INR exchange rate with low transparent fees. Remitly is also competitive, especially for first-time users." },
      { q: "How long does a EUR to INR transfer take?", a: "Wise and Remitly typically deliver within minutes to hours via SEPA transfer." },
      { q: "Do I need to report remittances from Germany?", a: "Under the Außenwirtschaftsgesetz, cross-border transfers above €12,500 must be reported to the Bundesbank for statistical purposes." },
      { q: "Is sending money from Germany to India taxable?", a: "No. Remittances are not taxable in Germany or India under normal circumstances." },
    ],
  },
  {
    slug: "qatar",
    country: "Qatar",
    currencyCode: "QAR",
    currencySymbol: "QR",
    flag: "🇶🇦",
    isoCode: "QA",
    diaspora: "750,000",
    annualRemittance: "$5.5 billion",
    avgTransfer: "QR 3,000",
    providers: ["wise", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Qatar to India?", a: "Wise offers competitive QAR to INR rates with transparent fees. Western Union is widely available but typically has higher margins." },
      { q: "How long does a QAR to INR transfer take?", a: "Most transfers arrive within 24 hours for bank deposits. Cash pickup via Western Union can be instant." },
      { q: "Is there a tax on remittance from Qatar to India?", a: "Qatar has no income tax or remittance tax. Inward remittances to India are not taxable for the recipient." },
      { q: "What documents do I need to send money from Qatar?", a: "You'll need a valid QID (Qatar Identity card) and passport. Some providers may require proof of income." },
    ],
  },
  {
    slug: "kuwait",
    country: "Kuwait",
    currencyCode: "KWD",
    currencySymbol: "KD",
    flag: "🇰🇼",
    isoCode: "KW",
    diaspora: "1 million",
    annualRemittance: "$5.3 billion",
    avgTransfer: "KD 200",
    providers: ["wise", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Kuwait to India?", a: "Wise typically offers the best KWD to INR rate. Exchange houses in Kuwait are also competitive for cash-based transfers." },
      { q: "How long does it take to send money from Kuwait to India?", a: "Online transfers via Wise arrive within hours. Western Union offers instant cash pickup." },
      { q: "Is remittance from Kuwait taxable?", a: "Kuwait has no income tax or remittance tax. Funds received in India from Kuwait are not taxable." },
      { q: "Can I send money to an NRE account from Kuwait?", a: "Yes, all major providers support NRE and NRO account deposits in India." },
    ],
  },
  {
    slug: "saudi-arabia",
    country: "Saudi Arabia",
    currencyCode: "SAR",
    currencySymbol: "SR",
    flag: "🇸🇦",
    isoCode: "SA",
    diaspora: "2.5 million",
    annualRemittance: "$8.5 billion",
    avgTransfer: "SR 3,000",
    providers: ["wise", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Saudi Arabia to India?", a: "Wise offers competitive SAR to INR rates. Local exchange houses offer competitive rates for cash transfers, while Wise is best for bank-to-bank." },
      { q: "How long does it take?", a: "Bank transfers typically arrive within 24 hours. Cash pickup is available instantly via Western Union." },
      { q: "Is there a tax on sending money from KSA to India?", a: "Saudi Arabia has no personal income tax or remittance levy. India does not tax inward remittances." },
      { q: "What is the daily/monthly limit?", a: "SAMA (Saudi Central Bank) allows up to SAR 30,000 per day for personal transfers. Annual limits may apply depending on your residency status." },
    ],
  },
  {
    slug: "new-zealand",
    country: "New Zealand",
    currencyCode: "NZD",
    currencySymbol: "NZ$",
    flag: "🇳🇿",
    isoCode: "NZ",
    diaspora: "240,000",
    annualRemittance: "$800 million",
    avgTransfer: "NZ$1,500",
    providers: ["wise", "remitly", "wu", "ofx", "torfx"],
    faq: [
      { q: "What is the cheapest way to send money from New Zealand to India?", a: "Wise offers the best NZD to INR rate. OFX and TorFX are also competitive for larger transfers." },
      { q: "How long does a NZD to INR transfer take?", a: "Wise delivers in minutes. OFX and TorFX take 1-2 business days." },
      { q: "Are there limits on sending money from NZ to India?", a: "NZ Financial Markets Authority requires reporting for transfers over NZD $10,000, but doesn't impose limits." },
      { q: "Is it taxable to send money from NZ to India?", a: "No. Remittances are not taxable in New Zealand. Recipients in India are also exempt from tax on gifts from relatives." },
    ],
  },
  {
    slug: "malaysia",
    country: "Malaysia",
    currencyCode: "MYR",
    currencySymbol: "RM",
    flag: "🇲🇾",
    isoCode: "MY",
    diaspora: "200,000",
    annualRemittance: "$600 million",
    avgTransfer: "RM 3,000",
    providers: ["wise", "remitly", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Malaysia to India?", a: "Wise and Instarem offer the best MYR to INR rates. Instarem is particularly strong in the Southeast Asia corridor." },
      { q: "How long does a MYR to INR transfer take?", a: "Most transfers arrive within 24 hours via Wise or Instarem." },
      { q: "Is remittance from Malaysia taxable?", a: "Malaysia does not tax outward remittances. India does not tax inward gifts from relatives." },
      { q: "What documents do I need?", a: "You'll need a valid MyKad and passport. Some providers accept a work permit or employment pass." },
    ],
  },
  {
    slug: "hong-kong",
    country: "Hong Kong",
    currencyCode: "HKD",
    currencySymbol: "HK$",
    flag: "🇭🇰",
    isoCode: "HK",
    diaspora: "55,000",
    annualRemittance: "$500 million",
    avgTransfer: "HK$10,000",
    providers: ["wise", "remitly", "wu", "instarem"],
    faq: [
      { q: "What is the cheapest way to send money from Hong Kong to India?", a: "Wise offers the best HKD to INR rate with low transparent fees. Instarem is also competitive for this corridor." },
      { q: "How long does a HKD to INR transfer take?", a: "Most transfers arrive within minutes to 24 hours." },
      { q: "Are there reporting requirements?", a: "Hong Kong has no foreign exchange controls. Transfers over HKD $120,000 may require additional KYC documentation." },
      { q: "Is remittance from HK to India taxable?", a: "Hong Kong has no tax on outward remittances. India does not tax inward remittances." },
    ],
  },
];

/** Look up a corridor by its URL slug */
export function getCorridorBySlug(slug: string): Corridor | undefined {
  return CORRIDORS.find((c) => c.slug === slug);
}

/** Get all corridor slugs for static generation */
export function getAllCorridorSlugs(): string[] {
  return CORRIDORS.map((c) => c.slug);
}
