"use client";

import AffiliateBanner from "./AffiliateBanner";
import EmailCaptureModal from "./EmailCaptureModal";
import StickyCTABar from "./StickyCTABar";

interface CalculatorLayoutProps {
  calculatorSlug: string;
  children: React.ReactNode;
}

export default function CalculatorLayout({
  calculatorSlug,
  children,
}: CalculatorLayoutProps) {
  return (
    <>
      {children}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <AffiliateBanner calculatorSlug={calculatorSlug} />
      </section>
      <EmailCaptureModal />
      <StickyCTABar />
    </>
  );
}
