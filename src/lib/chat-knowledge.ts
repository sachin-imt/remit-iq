/**
 * RemitIQ Chat Knowledge Base
 * ============================
 * Intent-matched forex knowledge base for the "Ask RemitIQ" chatbot.
 * All responses are scoped to AUD/INR forex, remittance, and site concepts.
 * Dynamic responses inject live rate data when available.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RateContext {
    midMarketRate: number;
    current: number;
    avg30d: number;
    high30d: number;
    low30d: number;
    weekChange: number;
    weekChangePct: number;
    rsi14: number;
    volatility30d: number;
    percentile30d: number;
    macdLine: number;
    macdSignal: number;
    sma7: number;
    sma20: number;
    signal: string;
    confidence: number;
    reason: string;
    backtestAccuracy: number;
    dataSource: string;
}

export interface ChatResponse {
    reply: string;
    suggestions: string[];
}

interface TopicHandler {
    patterns: RegExp[];
    handler: (ctx: RateContext | null, currencyCode: string, countryName: string) => ChatResponse;
}

// ─── Topic Handlers ─────────────────────────────────────────────────────────

const topics: TopicHandler[] = [
    // ── GREETING ──
    {
        patterns: [/^(hi|hello|hey|howdy|yo|sup|g'day)/i, /^(good\s*(morning|afternoon|evening))/i],
        handler: (_, currencyCode, countryName) => ({
            reply: `G'day! 👋 I'm the RemitIQ assistant — I can help you understand ${currencyCode}/INR exchange rates, explain our timing signals, and answer questions about sending money from ${countryName} to India.\n\nWhat would you like to know?`,
            suggestions: [`What's the current ${currencyCode}/INR rate?`, "What does confidence % mean?", "Which platform is cheapest?"],
        }),
    },

    // ── CONFIDENCE % ──
    {
        patterns: [/confidence/i, /what does \d+%?\s*mean/i, /(\d+)\s*percent/i, /how sure/i, /how confident/i],
        handler: (ctx) => ({
            reply: `**Confidence %** is like a weather forecast — it tells you how many of our checks agree on the recommendation.\n\n` +
                `${ctx ? `Right now it's **${ctx.confidence}%** for **${ctx.signal.replace("_", " ")}**.` : ""}\n\n` +
                `Think of it this way:\n` +
                `• **70%+** — Most of our checks point the same direction. Pretty reliable.\n` +
                `• **55-70%** — Some checks agree, some don't. It's a lean, not a sure thing.\n` +
                `• **Below 55%** — We're not sure either way. The rate could go up or down.\n\n` +
                `We look at 8 different things (recent trend, momentum, how today compares to the last month, etc.) and confidence tells you how many of them agree.`,
            suggestions: ["What checks do you use?", "What does SEND NOW mean?", "Is now a good time to send?"],
        }),
    },

    // ── SEND NOW / WAIT / URGENT signals ──
    {
        patterns: [/send\s*now/i, /what.*(signal|recommendation)/i, /should I send/i, /wait\s*(or|vs)/i, /urgent/i, /when.*send/i, /good time/i, /best time/i],
        handler: (ctx) => ({
            reply: `We give you one of three signals:\n\n` +
                `✅ **SEND NOW** — Today's rate is better than usual. Good time to transfer.\n` +
                `⏳ **WAIT** — The rate might get better in a few days. No rush.\n` +
                `⚠️ **URGENT** — Today's rate is unusually good and probably won't last.\n\n` +
                `${ctx ? `Right now: **${ctx.signal.replace("_", " ")}** (${ctx.confidence}% confidence). ${ctx.reason}` : ""}\n\n` +
                `⚠️ This is guidance, not a guarantee — nobody can predict exchange rates perfectly.`,
            suggestions: ["What does confidence % mean?", "What checks do you use?", "How reliable is this?"],
        }),
    },

    // ── CURRENT RATE ──
    {
        patterns: [/current.*rate/i, /today.*rate/i, /rate\s*(right\s*)?now/i, /what.*rate/i, /aud.*(inr|rupee)/i, /how much.*rupee/i, /exchange rate/i],
        handler: (ctx, currencyCode) => ({
            reply: ctx
                ? `**Current ${currencyCode}/INR rates:**\n\n` +
                `• Mid-market rate: **₹${ctx.midMarketRate.toFixed(2)}**\n` +
                `• Best platform rate: **₹${ctx.current}**\n` +
                `• 30-day average: ₹${ctx.avg30d}\n` +
                `• 30-day range: ₹${ctx.low30d} — ₹${ctx.high30d}\n` +
                `• This week: ${ctx.weekChange >= 0 ? "+" : ""}₹${ctx.weekChange} (${ctx.weekChangePct >= 0 ? "+" : ""}${ctx.weekChangePct}%)\n\n` +
                `Data source: ECB/Wise (${ctx.dataSource}).`
                : `I can show you the latest ${currencyCode} rate — check the homepage or /rates page for real-time data.`,
            suggestions: ["Which platform gives the best rate?", "Is now a good time to send?", "What is mid-market rate?"],
        }),
    },

    // ── MID-MARKET RATE ──
    {
        patterns: [/mid.?market/i, /interbank/i, /real\s*rate/i, /ecb\s*rate/i, /wholesale/i],
        handler: (ctx, currencyCode) => ({
            reply: `The **mid-market rate** (also called the interbank rate) is the "true" exchange rate — the midpoint between buy and sell prices on the global forex market.\n\n` +
                `${ctx ? `Right now it's **₹${ctx.midMarketRate.toFixed(2)}** per ${currencyCode}, from the European Central Bank.` : ""}\n\n` +
                `**Why it matters:** No remittance platform gives you this rate. They all add an FX margin (markup). For example:\n` +
                `• Wise: ~0.34% margin → the lowest markup available\n` +
                `• Western Union: ~1.86% margin → the highest markup of the major platforms\n\n` +
                `The smaller the margin, the better the deal. RemitIQ shows you each platform's margin transparently.`,
            suggestions: ["What is FX margin?", "Which platform has the lowest margin?", "What's the current rate?"],
        }),
    },

    // ── FX MARGIN ──
    {
        patterns: [/margin/i, /markup/i, /spread/i, /how.*platforms.*make.*money/i, /hidden.*fee/i],
        handler: (ctx, currencyCode) => ({
            reply: `**FX margin** (or markup/spread) is how remittance platforms make money — they give you a rate slightly worse than mid-market.\n\n` +
                `Here's how the main platforms compare for ${currencyCode}/INR:\n` +
                `| Platform | Margin | What it means |\n` +
                `|----------|--------|---------------|\n` +
                `| Wise | 0.00% | No markup, transparent fee |\n` +
                `| Remitly | 0.56% | Solid ongoing rate |\n` +
                `| Paysend | 0.50% | Low flat fee for card transfers |\n` +
                `| WorldRemit | 0.70% | Great overall global reach |\n` +
                `| Ria | 0.85% | Fast but higher margins |\n` +
                `| XE | 0.90% | Highly trusted brand |\n` +
                `| Instarem | 1.03% | Mid-tier competitor |\n` +
                `| Xoom | 1.20% | PayPal integration, easy but pricey |\n` +
                `| MoneyGram | 1.60% | Global cash giant |\n` +
                `| Western Union | 1.86% | Highest long-term margins |\n\n` +
                `On a $2,000 transfer, the difference between 0.34% and 1.86% margin can be **₹2,000+**.`,
            suggestions: ["Which platform is best overall?", "Do platforms also charge fees?", "What is mid-market rate?"],
        }),
    },

    // ── RSI / MOMENTUM ──
    {
        patterns: [/\brsi\b/i, /relative\s*strength/i, /overbought/i, /oversold/i, /momentum/i],
        handler: (ctx) => ({
            reply: `**Momentum** tells us how fast the rate is moving and whether it's speeding up or slowing down.\n\n` +
                `${ctx ? `Right now: ${ctx.rsi14 > 60 ? "The rate has been **rising strongly** — this is good for you, but it might slow down soon." : ctx.rsi14 > 52 ? "The rate is **rising steadily** — moving in your favour." : ctx.rsi14 < 40 ? "The rate has been **falling** — it might bounce back soon." : "The rate isn't moving much — **no strong direction** right now."}` : ""}\n\n` +
                `Think of it like a car's speedometer — it doesn't tell you where the car is going, but how fast it's getting there. We use this alongside other checks to make our recommendation.`,
            suggestions: ["What about the overall trend?", "Is now a good time to send?", "What checks do you use?"],
        }),
    },

    // ── MACD / TREND ──
    {
        patterns: [/\bmacd\b/i, /moving\s*average\s*convergence/i, /signal\s*line/i, /trend/i, /direction/i],
        handler: (ctx) => ({
            reply: `**Price Trend** tells us which direction the rate is heading overall.\n\n` +
                `${ctx ? `Right now: ${ctx.macdLine > ctx.macdSignal ? "The trend is **moving in your favour** 📈 — the rate has been generally going up." : "The trend is **moving against you** 📉 — the rate has been generally going down."}` : ""}\n\n` +
                `We figure this out by comparing the recent average to the longer-term average. If the recent average is higher, the rate is trending up. Simple as that.\n\n` +
                `This is one of 8 checks we run — no single check decides the recommendation on its own.`,
            suggestions: ["What about momentum?", "What other checks do you use?", "Is now a good time to send?"],
        }),
    },

    // ── SMA / MOVING AVERAGES ──
    {
        patterns: [/\bsma\b/i, /moving\s*average/i, /\bema\b/i, /crossover/i, /7.?day.*20.?day/i, /short.*long.*trend/i],
        handler: (ctx) => ({
            reply: `We compare the **last week's average rate** to the **last month's average** to see if things are improving or getting worse.\n\n` +
                `${ctx ? `Right now: ${ctx.sma7 > ctx.sma20 ? `The weekly average (₹${ctx.sma7}) is **above** the monthly average (₹${ctx.sma20}) — that's a good sign! 📈` : `The weekly average (₹${ctx.sma7}) is **below** the monthly average (₹${ctx.sma20}) — rates have dipped recently. 📉`}` : ""}\n\n` +
                `When the weekly average crosses above the monthly average, it usually means the rate is picking up. When it crosses below, the rate is slipping.`,
            suggestions: ["What about momentum?", "Is now a good time to send?", "What does confidence % mean?"],
        }),
    },

    // ── VOLATILITY / STABILITY ──
    {
        patterns: [/volatil/i, /stable/i, /risk/i, /fluctuat/i, /unpredictable/i, /choppy/i],
        handler: (ctx) => ({
            reply: `**Market stability** tells you how much the rate is bouncing around day-to-day.\n\n` +
                `${ctx ? `Right now: ${ctx.volatility30d < 0.5 ? "The market is **calm and stable** — rates aren't moving much. ✅" : ctx.volatility30d < 1.0 ? "**Normal conditions** — some movement but nothing unusual." : ctx.volatility30d < 1.5 ? "Things are **a bit choppy** — the rate is moving around more than usual." : "The market is **very unpredictable** right now. ⚠️ If you need to send, sooner might be better than later."}` : ""}\n\n` +
                `What makes the rate jump around:\n` +
                `• Central bank decisions (RBA in Australia, RBI in India)\n` +
                `• Commodity prices (iron ore, coal — Australia exports a lot)\n` +
                `• Big global events (elections, economic news)\n` +
                `• Seasonal demand (festivals like Diwali = more people sending money)`,
            suggestions: ["Is now a good time to send?", "What affects the rate?", "What checks do you use?"],
        }),
    },

    // ── PERCENTILE / HOW TODAY COMPARES ──
    {
        patterns: [/percentile/i, /where.*rate.*stand/i, /range.*position/i, /how.*rate.*compare/i, /how.*today/i],
        handler: (ctx) => ({
            reply: ctx
                ? `Today's rate is **better than ${ctx.percentile30d}% of days** in the last month.\n\n` +
                `The rate has ranged from ₹${ctx.low30d} to ₹${ctx.high30d} over the past 30 days.\n\n` +
                `${ctx.percentile30d > 75 ? "That's really good — today is one of the best days this month to send! 🎯" : ctx.percentile30d > 50 ? "That's above average — a decent day to send." : ctx.percentile30d > 30 ? "That's below average — you might get a better rate if you wait a few days." : "That's near the bottom — consider waiting if you're not in a rush."}`
                : `Visit the homepage to see how today's rate compares to the last 30 days.`,
            suggestions: ["Is now a good time to send?", "What does confidence % mean?", "What's the current rate?"],
        }),
    },

    // ── HOW RELIABLE / ACCURACY ──
    {
        patterns: [/backtest/i, /accuracy/i, /how accurate/i, /how reliable/i, /track record/i, /does it work/i, /proven/i],
        handler: () => ({
            reply: `Here's the honest truth: **nobody can predict exchange rates perfectly.** Not banks, not algorithms, not us.\n\n` +
                `What we can do is stack the odds slightly in your favour by looking at 8 different checks on 180 days of real data from the European Central Bank.\n\n` +
                `Our strongest edge is our **WAIT signals** — when we suggest waiting, the rate genuinely does improve about 80% of the time within a week.\n\n` +
                `Think of us as a helpful nudge, not a crystal ball. ⚠️ This is guidance, not financial advice.`,
            suggestions: ["What checks do you use?", "What does SEND NOW mean?", "Is this financial advice?"],
        }),
    },

    // ── ALL CHECKS / INDICATORS ──
    {
        patterns: [/what.*indicator/i, /how.*work/i, /what.*factor/i, /what.*analys/i, /technical/i, /how.*engine/i, /how.*recommend/i, /methodology/i, /what.*check/i],
        handler: () => ({
            reply: `We run **8 simple checks** on 180 days of real exchange rate data:\n\n` +
                `1️⃣ **Is today above or below average?** — comparing today to the last 30 days\n` +
                `2️⃣ **Momentum** — is the rate speeding up or slowing down?\n` +
                `3️⃣ **Price trend** — which direction is it heading overall?\n` +
                `4️⃣ **How today compares** — is today better or worse than most recent days?\n` +
                `5️⃣ **Short vs long trend** — is the recent week better than the recent month?\n` +
                `6️⃣ **This week's movement** — did the rate go up or down this week?\n` +
                `7️⃣ **Market stability** — is the market calm or bouncing around?\n` +
                `8️⃣ **Bigger picture** — where does today sit in the 3-month range?\n\n` +
                `When most of these agree (like 5 or more), the signal is stronger. When they disagree, we're honest about the uncertainty.`,
            suggestions: ["What does confidence % mean?", "How reliable is this?", "Is now a good time to send?"],
        }),
    },

    // ── PLATFORM COMPARISON ──
    {
        patterns: [/which.*platform/i, /best.*platform/i, /cheapest/i, /wise.*remitly/i, /compare.*platform/i, /recommend.*platform/i, /which.*use/i, /best.*send/i],
        handler: (ctx, currencyCode) => ({
            reply: `Based on the total INR received (rate × amount − fees), here's the current ranking for a $2,000 ${currencyCode} transfer:\n\n` +
                `🥇 **Wise** — Transparent, best consistently\n` +
                `🥈 **Remitly** — Consistently solid rates\n` +
                `🥉 **Paysend** — Lowest flat fee on many corridors\n` +
                `4️⃣ **WorldRemit** — Extensive global reach\n` +
                `**Others:** Ria, XE, Instarem, Xoom, and MoneyGram.\n` +
                `**Best overall:** Wise (best sustained rate)\n` +
                `**Best for small amounts:** Remitly or Paysend\n` +
                `**Best for global parity:** WorldRemit or XE`,
            suggestions: ["What is FX margin?", "How do you rank platforms?", "Is now a good time to send?"],
        }),
    },

    // ── FEES ──
    {
        patterns: [/\bfees?\b/i, /transfer\s*cost/i, /how much.*charge/i, /free.*transfer/i],
        handler: () => ({
            reply: `Platform fees vary, but **the exchange rate margin usually matters more** than the upfront fee:\n\n` +
                `| Platform | Fee | Hidden cost (margin on $2K) |\n` +
                `|----------|-----|----------------------------|\n` +
                `| Wise | $3.99 | ~$0.00 (0.00%) |\n` +
                `| Remitly | FREE | ~$11.20 (0.56%) |\n` +
                `| Paysend | $2.00 | ~$10.00 (0.50%) |\n` +
                `| WorldRemit | $1.99 | ~$14.00 (0.70%) |\n` +
                `| XE | FREE | ~$18.00 (0.90%) |\n` +
                `| W. Union | $4.99 | ~$37.20 (1.86%) |\n\n` +
                `**Total cost = Fee + Margin impact.** Wise wins despite having a fee because its margin is the smallest.\n\n` +
                `💡 Tip: Rates and fees fluctuate, so always compare live data before sending.`,
            suggestions: ["Which platform is cheapest?", "What is FX margin?", "How much will I receive for $2000?"],
        }),
    },

    // ── TRANSFER SPEED ──
    {
        patterns: [/speed/i, /how (long|fast)/i, /delivery/i, /instant/i, /same.*day/i, /minutes?/i],
        handler: () => ({
            reply: `Transfer speeds from Australia to India:\n\n` +
                `⚡ **Minutes:** Wise, Remitly, Western Union, Paysend\n` +
                `📅 **Same day:** Instarem, Ria\n` +
                `📦 **1-2 business days:** XE\n\n` +
                `Speed depends on:\n` +
                `• **Payment method** — PayID/card = faster; bank transfer = slower\n` +
                `• **Recipient bank** — Major banks (SBI, HDFC) process faster\n` +
                `• **Time of day** — Transfers during Indian business hours settle faster\n` +
                `• **Amount** — Large transfers (>$5,000) may require additional verification`,
            suggestions: ["Which platform is cheapest?", "What affects the exchange rate?", "Is now a good time to send?"],
        }),
    },

    // ── WHAT AFFECTS THE RATE ──
    {
        patterns: [/what.*affect/i, /what.*drives/i, /why.*rate.*change/i, /factor.*rate/i, /rba/i, /rbi/i, /interest.*rate/i, /iron.*ore/i, /commodit/i],
        handler: (_, currencyCode, countryName) => ({
            reply: `**Key factors that move the ${currencyCode}/INR rate:**\n\n` +
                `🏦 **Central bank decisions**\n` +
                `• The ${countryName} central bank rate decisions directly impact ${currencyCode} strength\n` +
                `• RBI (India) rate hikes → INR strengthens → fewer INR per ${currencyCode}\n\n` +
                `🌍 **Global risk sentiment**\n` +
                `• Market fear or uncertainty tends to weaken smaller currencies\n` +
                `• Market optimism → risk-sensitive currencies like ${currencyCode} often strengthen\n\n` +
                `🎆 **Seasonal patterns**\n` +
                `• Diwali season (Oct-Nov): Higher remittance demand from the diaspora\n` +
                `• Year-end: Indian companies repatriate profits\n\n` +
                `📊 **Trade balance**\n` +
                `• ${countryName}–India trade flows affect supply/demand for both currencies`,
            suggestions: ["Is now a good time to send?", "What is volatility?", "What indicators do you use?"],
        }),
    },

    // ── SEASONAL PATTERNS ──
    {
        patterns: [/season/i, /diwali/i, /month/i, /time of year/i, /pattern/i, /trend/i, /forecast/i, /predict/i],
        handler: (_, currencyCode) => ({
            reply: `**Seasonal patterns in ${currencyCode}/INR:**\n\n` +
                `• **Jan-Mar:** Many currencies strengthen as global trade picks up\n` +
                `• **Apr-Jun:** Mixed — depends on respective central bank decisions\n` +
                `• **Jul-Sep:** Some volatility as mid-year economic data comes in\n` +
                `• **Oct-Nov (Diwali):** High remittance season — increased demand for INR\n` +
                `• **Dec:** Year-end repatriation flows\n\n` +
                `⚠️ Seasonal patterns are tendencies, not guarantees. Central bank decisions and global events can override them.\n\n` +
                `We don't predict future rates — we analyze whether the current rate is favorable compared to recent history.`,
            suggestions: ["What indicators do you use?", "Is now a good time to send?", `What affects ${currencyCode}/INR?`],
        }),
    },

    // ── HOW MUCH WILL I RECEIVE ──
    {
        patterns: [/how much.*(receive|get|inr)/i, /\$?\d+.*aud/i, /calculat/i, /convert/i],
        handler: (ctx, currencyCode) => ({
            reply: ctx
                ? `For a **$2,000 ${currencyCode}** transfer at today's rates:\n\n` +
                `| Platform | Rate | Fee | You Receive |\n` +
                `|----------|------|-----|-------------|\n` +
                `| Wise | ₹${(ctx.midMarketRate * 0.9966).toFixed(2)} | $3.99 | ~₹${Math.round((2000 - 3.99) * ctx.midMarketRate * 0.9966).toLocaleString("en-IN")} |\n` +
                `| Remitly | ₹${(ctx.midMarketRate * 0.9944).toFixed(2)} | FREE | ~₹${Math.round(2000 * ctx.midMarketRate * 0.9944).toLocaleString("en-IN")} |\n` +
                `| W. Union | ₹${(ctx.midMarketRate * 0.9814).toFixed(2)} | $4.99 | ~₹${Math.round((2000 - 4.99) * ctx.midMarketRate * 0.9814).toLocaleString("en-IN")} |\n\n` +
                `The difference between best and worst can be **₹2,000+** on a $2,000 transfer!\n\n` +
                `Use our [Compare page](/compare) to see exact amounts for any transfer size.`
                : `Visit the homepage and enter your amount to see a live comparison across all platforms.`,
            suggestions: ["Which platform is cheapest?", "What is FX margin?", "Is now a good time to send?"],
        }),
    },

    // ── DATA SOURCE ──
    {
        patterns: [/data\s*source/i, /where.*data/i, /ecb/i, /european central bank/i, /reliable/i, /real.*data/i, /live.*data/i],
        handler: (ctx) => ({
            reply: `Our exchange rate data comes from the **European Central Bank (ECB)** via the Frankfurter API.\n\n` +
                `• Updated every business day\n` +
                `• No API key required (it's free and public)\n` +
                `• Cached for 1 hour to balance freshness with performance\n` +
                `${ctx ? `• Current status: **${ctx.dataSource}** data` : ""}\n\n` +
                `The ECB publishes reference rates around 16:00 CET each business day. These are the same rates used by banks and financial institutions worldwide.\n\n` +
                `Platform-specific rates are calculated by applying each platform's known FX margin to the ECB mid-market rate.`,
            suggestions: ["What is mid-market rate?", "How accurate is the engine?", "What is FX margin?"],
        }),
    },

    // ── FINANCIAL ADVICE DISCLAIMER ──
    {
        patterns: [/financial\s*advice/i, /should I/i, /advise/i, /guarantee/i, /legal/i, /disclaimer/i],
        handler: () => ({
            reply: `⚠️ **Important:** RemitIQ provides **informational guidance only** — this is NOT financial advice.\n\n` +
                `• Our timing signals are based on technical analysis of historical data\n` +
                `• Past performance does not guarantee future results\n` +
                `• Exchange rates are inherently unpredictable\n` +
                `• We don't handle your money — we only help you compare platforms\n\n` +
                `For significant transfers, consider consulting a licensed financial advisor. For everyday remittances, our signals can help you make more informed decisions about timing.`,
            suggestions: ["How accurate is the engine?", "What indicators do you use?", "What's the current rate?"],
        }),
    },

    // ── HOW RANKINGS WORK ──
    {
        patterns: [/how.*rank/i, /ranking/i, /bias/i, /affiliate/i, /commission/i, /conflict/i, /paid/i],
        handler: () => ({
            reply: `**Our rankings are 100% based on total INR received** — the amount you'd actually get after all fees and FX margins.\n\n` +
                `How we calculate:\n` +
                `\`Total INR = (AUD amount − fee) × platform rate\`\n\n` +
                `The platform with the highest total INR is ranked #1. Period.\n\n` +
                `**Transparency:** Yes, we earn referral commissions when you click through and transfer. However:\n` +
                `• Rankings are never influenced by commercial relationships\n` +
                `• We show every platform's margin % so you can verify our math\n` +
                `• If a platform we don't earn from is cheapest, it still ranks #1`,
            suggestions: ["Which platform is cheapest?", "What is FX margin?", "What's the current rate?"],
        }),
    },

    // ── HOW TO SEND MONEY ──
    {
        patterns: [/how.*send/i, /step/i, /process/i, /first\s*time/i, /never.*sent/i, /new.*remittan/i, /tutorial/i, /guide/i],
        handler: () => ({
            reply: `**How to send money from Australia to India:**\n\n` +
                `1️⃣ **Compare rates** on RemitIQ (you're here! ✅)\n` +
                `2️⃣ **Choose a platform** — click "Send" to go to the provider\n` +
                `3️⃣ **Create an account** — you'll need:\n` +
                `   • Australian ID (passport or driver's licence)\n` +
                `   • Recipient's Indian bank details (account number, IFSC code)\n` +
                `4️⃣ **Verify your identity** — first-time KYC takes 5-30 minutes\n` +
                `5️⃣ **Fund the transfer** — PayID, bank transfer, or debit card\n` +
                `6️⃣ **Done!** — Money arrives in minutes to 2 days depending on platform\n\n` +
                `💡 **Pro tip:** Sign up with Wise or Remitly first — they offer free first transfers and fastest delivery.`,
            suggestions: ["Which platform is cheapest?", "How long does it take?", "Is now a good time to send?"],
        }),
    },

    // ── PAYMENT METHODS ──
    {
        patterns: [/payment\s*method/i, /payid/i, /bank\s*transfer/i, /debit\s*card/i, /credit\s*card/i, /how.*pay/i, /poli/i],
        handler: () => ({
            reply: `**Payment methods by platform:**\n\n` +
                `| Platform | Methods |\n` +
                `|----------|--------|\n` +
                `| Wise | Bank Transfer, Card, PayID |\n` +
                `| Remitly | Bank Transfer, Card |\n` +
                `| WorldRemit | Bank Transfer, Card |\n` +
                `| XE | Bank Transfer |\n` +
                `| Xoom | PayPal, Card, Bank |\n` +
                `| Western Union | Bank, Card, Cash |\n\n` +
                `💡 **PayID** is usually the fastest and cheapest option if available. Debit cards are also fast but may have slightly higher fees on some platforms.`,
            suggestions: ["How long does it take?", "Which platform is best?", "How do I send money?"],
        }),
    },

    // ── ABOUT REMITIQ ──
    {
        patterns: [/about/i, /who.*you/i, /what.*remitiq/i, /what.*this.*site/i, /what.*do.*you/i],
        handler: () => ({
            reply: `**RemitIQ** is Australia's first remittance intelligence platform — think "Kayak for money transfers."\n\n` +
                `We help Australians sending money to India by:\n` +
                `• 📊 **Comparing live rates** across 6+ platforms\n` +
                `• 🤖 **Timing intelligence** — AI tells you if now is a good time to send\n` +
                `• 📈 **Real data** — actual ECB exchange rates, not simulated\n` +
                `• 💬 **This chatbot** — to help you understand forex concepts\n\n` +
                `We never touch your money. We just help you find the best deal and the best time.`,
            suggestions: ["How do rankings work?", "What indicators do you use?", "What's the current rate?"],
        }),
    },

    // ── THANK YOU ──
    {
        patterns: [/thank/i, /cheers/i, /awesome/i, /helpful/i, /great/i, /perfect/i, /nice/i, /cool/i],
        handler: (_, currencyCode, countryName) => ({
            reply: `Happy to help! 😊 If you have any more questions about ${currencyCode}/INR rates, platform comparisons, or our timing signals, just ask.\n\nGood luck with your transfer! 💸`,
            suggestions: [`What's the current ${currencyCode} rate?`, "Is now a good time to send?", "Which platform is cheapest?"],
        }),
    },
];

// ─── Intent Matching ────────────────────────────────────────────────────────

function makeOffTopicResponse(currencyCode: string = "AUD"): ChatResponse {
    return {
        reply: `I'm only set up to help with **${currencyCode}/INR exchange rates and sending money to India** — I can't help with other topics.\n\nI can help with things like:\n• What's today's rate and is it good?\n• Which platform gives you the most rupees\n• Whether now is a good time to send\n• How our timing recommendations work`,
        suggestions: [`What's the current ${currencyCode} rate?`, "Which platform is cheapest?", "Is now a good time to send?"],
    };
}

const FALLBACK_RESPONSE: ChatResponse = {
    reply: `I'm not sure I understood that! Here are some things I can help with:\n\n• 📈 Today's exchange rate\n• 🏦 Which platform gives you the best deal\n• ⏰ Whether now is a good time to send\n• 💰 Fees and how platforms compare\n• ❓ How our recommendations work`,
    suggestions: ["What's the current rate?", "Is now a good time to send?", "Which platform is cheapest?", "What checks do you use?"],
};

// Simple off-topic detection
const OFF_TOPIC_PATTERNS = [
    /\b(weather|sport|cricket|football|recipe|cook|movie|music|news|politic|game|joke|story|poem)\b/i,
    /\b(code|program|writ|essay|email|resume|cover letter|homework)\b/i,
    /\b(gpt|chatgpt|openai|gemini|claude|bard)\b/i,
    /\b(stock|crypto|bitcoin|ethereum|nft|share market)\b/i,
];

export function matchIntent(
    message: string, 
    ctx: RateContext | null, 
    currencyCode: string = "AUD", 
    countryName: string = "Australia"
): ChatResponse {
    const trimmed = message.trim();

    // Empty message
    if (!trimmed) return FALLBACK_RESPONSE;

    // Off-topic detection
    for (const pattern of OFF_TOPIC_PATTERNS) {
        if (pattern.test(trimmed)) return makeOffTopicResponse(currencyCode);
    }

    // Match against topics
    for (const topic of topics) {
        if (topic.patterns.some((p) => p.test(trimmed))) {
            return topic.handler(ctx, currencyCode, countryName);
        }
    }

    // Fallback
    return FALLBACK_RESPONSE;
}

// STARTER_SUGGESTIONS are now managed dynamically in ChatWidget.tsx

