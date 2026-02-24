import type { Metadata } from "next";
import DataManagementForm from "@/components/DataManagementForm";

export const metadata: Metadata = {
    title: "Privacy Policy | RemitIQ",
    description: "How RemitIQ collects, uses, and protects your personal information. Your rights under the Australian Privacy Act 1988 and GDPR.",
};

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#C8D8E8" }}>{title}</h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#7A9CC4" }}>
                {children}
            </div>
        </section>
    );
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
            {/* Header */}
            <div className="border-b" style={{ borderColor: "#1E3A5F", backgroundColor: "#111D32" }}>
                <div className="max-w-4xl mx-auto px-6 py-16">
                    <h1 className="text-5xl font-bold mb-4" style={{ color: "#C8D8E8" }}>
                        Privacy Policy
                    </h1>
                    <p className="text-sm" style={{ color: "#7A9CC4" }}>
                        Last updated: 23 February 2026
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">

                <Section title="1. Data Controller">
                    <p>
                        RemitIQ (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website <strong style={{ color: "#C8D8E8" }}>remitiq.co</strong> and is the data controller responsible for your personal information. RemitIQ is based in Australia and primarily serves users sending money from Australia to India.
                    </p>
                    <p>
                        For any privacy-related inquiries, please contact us at <strong style={{ color: "#F0B429" }}>privacy@remitiq.co</strong>.
                    </p>
                </Section>

                <Section title="2. Information We Collect">
                    <p>We collect minimal personal information, limited to what is necessary to provide our services:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong style={{ color: "#C8D8E8" }}>Email address</strong> — collected only when you voluntarily sign up for rate alerts. Used solely to send you exchange rate notifications.</li>
                        <li><strong style={{ color: "#C8D8E8" }}>Rate alert preferences</strong> — the target exchange rate and alert type you set when creating an alert.</li>
                        <li><strong style={{ color: "#C8D8E8" }}>Analytics data</strong> — anonymised usage data (page views, device type, country) collected via Vercel Analytics, only if you consent via our cookie banner. No personally identifiable information is collected by analytics.</li>
                    </ul>
                    <p>We do <strong style={{ color: "#C8D8E8" }}>not</strong> collect: financial account details, identity documents, payment information, or sensitive personal information.</p>
                </Section>

                <Section title="3. Legal Basis for Processing">
                    <p>We process your data under the following legal bases:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong style={{ color: "#C8D8E8" }}>Consent</strong> — for rate alert emails (you opt in by submitting the alert form) and analytics cookies (you opt in via the cookie consent banner).</li>
                        <li><strong style={{ color: "#C8D8E8" }}>Legitimate interest</strong> — for operating and improving our service, detecting fraud, and ensuring security.</li>
                    </ul>
                    <p>You may withdraw your consent at any time by deleting your data using the form below or by contacting us directly.</p>
                </Section>

                <Section title="4. How We Use Your Information">
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>To send rate alert emails when exchange rates reach your target</li>
                        <li>To understand how our website is used and improve the experience (aggregated analytics only)</li>
                        <li>To respond to your enquiries or data requests</li>
                    </ul>
                    <p>We <strong style={{ color: "#C8D8E8" }}>never</strong> sell, rent, or share your personal data with third parties for marketing purposes. Our rankings are based solely on the total INR you receive and are never influenced by commercial relationships.</p>
                </Section>

                <Section title="5. Third-Party Services">
                    <p>We use the following third-party services to operate RemitIQ:</p>
                    <div className="space-y-3 mt-3">
                        <div className="rounded-lg p-4" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                            <p><strong style={{ color: "#C8D8E8" }}>Vercel Analytics</strong> — anonymised website analytics (page views, device type, geography). No personal data is sent. Data processed in the United States. <a href="https://vercel.com/docs/analytics/privacy-policy" className="underline" style={{ color: "#F0B429" }}>Vercel Privacy Policy</a></p>
                        </div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                            <p><strong style={{ color: "#C8D8E8" }}>Resend</strong> — transactional email delivery for rate alerts and verification codes. Your email address is shared with Resend solely to deliver emails. Data processed in the United States. <a href="https://resend.com/legal/privacy-policy" className="underline" style={{ color: "#F0B429" }}>Resend Privacy Policy</a></p>
                        </div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                            <p><strong style={{ color: "#C8D8E8" }}>Wise API &amp; Frankfurter API</strong> — exchange rate data sources. No personal user data is sent to these services.</p>
                        </div>
                    </div>
                </Section>

                <Section title="6. Cookies & Tracking">
                    <p>RemitIQ uses a consent-based approach to cookies and tracking:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong style={{ color: "#C8D8E8" }}>Cookie consent preference</strong> — stored in your browser&apos;s localStorage (not a cookie). Records whether you accepted or rejected analytics tracking.</li>
                        <li><strong style={{ color: "#C8D8E8" }}>Vercel Analytics</strong> — only loaded if you click &quot;Accept&quot; on the cookie consent banner. Collects anonymised usage data. No analytics data is collected if you reject.</li>
                    </ul>
                    <p>We do not use advertising cookies, social media trackers, or any other third-party tracking technologies.</p>
                </Section>

                <Section title="7. Data Retention">
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><strong style={{ color: "#C8D8E8" }}>Rate alerts</strong> — retained until the alert is triggered or you request deletion. Triggered alerts are deactivated but the record is kept for 90 days before automatic purging.</li>
                        <li><strong style={{ color: "#C8D8E8" }}>Analytics data</strong> — retained by Vercel in accordance with their data retention policies (typically up to 26 months).</li>
                        <li><strong style={{ color: "#C8D8E8" }}>Verification codes</strong> — expire automatically after 10 minutes and are not retained beyond that.</li>
                    </ul>
                </Section>

                <Section title="8. International Data Transfers">
                    <p>
                        RemitIQ is hosted on Vercel, which processes data in the United States. Email delivery via Resend also occurs in the United States. By using our service, you acknowledge that your data may be transferred to and processed in the United States, which may have different data protection standards than Australia or the European Union.
                    </p>
                    <p>
                        We ensure appropriate safeguards are in place by using service providers that comply with industry-standard security practices and, where applicable, Standard Contractual Clauses (SCCs) for GDPR compliance.
                    </p>
                </Section>

                <Section title="9. Your Rights">
                    <div className="space-y-4">
                        <div className="rounded-lg p-4" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                            <h3 className="font-semibold mb-2" style={{ color: "#F0B429" }}>Australian Privacy Act 1988</h3>
                            <p>Under the Australian Privacy Principles (APPs), you have the right to:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                                <li>Know what personal information we hold about you (APP 12)</li>
                                <li>Request correction of inaccurate information (APP 13)</li>
                                <li>Complain about a breach of the APPs to the Office of the Australian Information Commissioner (OAIC)</li>
                            </ul>
                        </div>

                        <div className="rounded-lg p-4" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                            <h3 className="font-semibold mb-2" style={{ color: "#F0B429" }}>GDPR (EU/EEA Visitors)</h3>
                            <p>If you are located in the EU or EEA, you additionally have the right to:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                                <li>Access your personal data (Article 15)</li>
                                <li>Rectification of inaccurate data (Article 16)</li>
                                <li>Erasure / &quot;right to be forgotten&quot; (Article 17)</li>
                                <li>Data portability in a machine-readable format (Article 20)</li>
                                <li>Object to processing (Article 21)</li>
                                <li>Withdraw consent at any time</li>
                                <li>Lodge a complaint with your local supervisory authority</li>
                            </ul>
                        </div>

                        <div className="rounded-lg p-4" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                            <h3 className="font-semibold mb-2" style={{ color: "#F0B429" }}>CAN-SPAM Compliance</h3>
                            <p>All rate alert emails include an unsubscribe mechanism. We honour unsubscribe requests promptly. We never use deceptive subject lines or misleading sender information.</p>
                        </div>
                    </div>
                </Section>

                {/* Manage Your Data - Interactive Section */}
                <section id="manage" className="mb-12">
                    <div className="rounded-lg p-8 border" style={{ backgroundColor: "#111D32", borderColor: "#1E3A5F" }}>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0B429" }}>
                            Manage Your Data
                        </h2>
                        <p className="text-sm mb-6" style={{ color: "#7A9CC4" }}>
                            Access, export, or delete the personal data we hold about you. You will need to verify your email address to proceed.
                        </p>
                        <DataManagementForm />
                    </div>
                </section>

                <Section title="10. Changes to This Policy">
                    <p>
                        We may update this privacy policy from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this policy periodically. Continued use of RemitIQ after changes constitutes acceptance of the updated policy.
                    </p>
                </Section>

                <Section title="11. Contact Us">
                    <p>
                        If you have questions about this privacy policy, your data, or wish to exercise any of your rights, please contact us:
                    </p>
                    <div className="rounded-lg p-4 mt-3" style={{ backgroundColor: "#111D32", border: "1px solid #1E3A5F" }}>
                        <p><strong style={{ color: "#C8D8E8" }}>RemitIQ Privacy Team</strong></p>
                        <p>Email: <strong style={{ color: "#F0B429" }}>privacy@remitiq.co</strong></p>
                        <p className="mt-2">For complaints about our handling of your personal information, you may also contact:</p>
                        <p className="mt-1"><strong style={{ color: "#C8D8E8" }}>Office of the Australian Information Commissioner (OAIC)</strong></p>
                        <p>Website: <a href="https://www.oaic.gov.au" className="underline" style={{ color: "#F0B429" }}>oaic.gov.au</a></p>
                    </div>
                </Section>

            </div>

            <div className="h-16" />
        </div>
    );
}
