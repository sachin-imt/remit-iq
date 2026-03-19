/**
 * JSON-LD structured data components for SEO.
 * These inject schema.org markup into the page <head>.
 */

interface WebSiteSchemaProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebSiteSchema({
  name = "RemitIQ",
  url = "https://remitiq.co",
  description = "Compare live exchange rates across 6+ platforms. Find the cheapest way to send money to India.",
}: WebSiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/?amount={amount}`,
      "query-input": "required name=amount",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FinancialServiceSchemaProps {
  name?: string;
  url?: string;
  description?: string;
  areaServed?: string[];
}

export function FinancialServiceSchema({
  name = "RemitIQ",
  url = "https://remitiq.co",
  description = "AI-powered remittance comparison platform helping users find the cheapest way to send money to India.",
  areaServed = ["Worldwide"],
}: FinancialServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name,
    url,
    description,
    serviceType: "Money Transfer Comparison",
    areaServed: areaServed.map((area) => ({
      "@type": "Country",
      name: area,
    })),
    provider: {
      "@type": "Organization",
      name,
      url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  if (!items || items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
