import fs from 'fs';
import path from 'path';
import { getCachedIntelligence } from '../lib/db';

async function fetchRedditIntel(subreddit: string, query: string) {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=hot&restrict_sr=on&limit=3`;
        const response = await fetch(url, { headers: { 'User-Agent': 'RemitIQ-Content-Bot/1.0' } });
        if (!response.ok) return [];

        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.data.children.map((child: any) => ({
            title: child.data.title,
            url: `https://reddit.com${child.data.permalink}`,
            score: child.data.score
        }));
    } catch (error) {
        console.error(`[Reddit Scraper Error] Failed to fetch r/${subreddit}:`, error);
        return [];
    }
}

async function generateDailyPost() {
    console.log("🚀 Starting Daily (Template-Based) Content Pipeline...");

    // 1. GATHER SOCIAL INTELLIGENCE
    console.log("📡 Scraping r/AusFinance and r/India...");
    const ausFinanceTopics = await fetchRedditIntel('AusFinance', 'transfer OR remittance OR INR');
    const indiaTopics = await fetchRedditIntel('india', 'remittance OR AUD');

    let discussionsHtml = '';
    const allTopics = [...ausFinanceTopics, ...indiaTopics];

    if (allTopics.length > 0) {
        discussionsHtml = `### 🗣️ What the Community is Saying Today\n\nWe scanned the top financial subreddits for the latest discussions on transferring money:\n\n`;
        allTopics.forEach(topic => {
            discussionsHtml += `- [${topic.title}](${topic.url}) *(👍 ${topic.score} upvotes)*\n`;
        });
    } else {
        discussionsHtml = `### 🗣️ Daily Community Sentiment\n\nThe community remains focused on finding the lowest hidden fees and bypassing bank exchange rate markups.`;
    }

    // 2. FETCH MARKET INTELLIGENCE
    console.log("📊 Fetching live market data from SQLite cache...");
    const cachedData = getCachedIntelligence();
    const midRate = cachedData ? cachedData.midMarketRate : '64.00';
    const action = cachedData?.data?.recommendation?.signal || 'WAIT';
    const confidence = cachedData?.data?.recommendation?.confidence || 50;

    // 3. GENERATE PROGRAMMATIC MDX 
    console.log("📝 Building MDX Template...");

    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `daily-insights-${dateStr}`;

    const mdxTemplate = `---
title: "Remittance Daily: Is ₹${midRate} a Good Rate to Send AUD to India Today?"
excerpt: "Our daily algorithmic breakdown of the AUD/INR market. We analyze interbank rates, AI timing signals, and fresh community sentiment to help you save on your transfer."
date: "${dateStr}"
readTime: 3
slug: "${slug}"
featured: false
---

Welcome to today's edition of **RemitIQ Daily Insights**. Whether you're paying a mortgage in India, supporting family, or sending business capital, getting a grip on real-time market volatility is crucial.

Let's break down where the AUD/INR market sits today and what the community is focusing on.

## 📈 The Market at a Glance (AUD to INR)

The interbank mid-market rate is currently sitting around **₹${midRate}**. Note that this is the wholesale rate—banks will dynamically add their own retail markups to this number.

Our proprietary timing engine has analyzed the short-term trailing margins and produced the following signal for today:

- **AI Recommendation:** \`${action}\`
- **Engine Confidence:** ${confidence}%

*(If the signal is "Send Now", it means our system actively detects a short-term peak where provider margins are unusually favorable. If it's "Wait", the currency is experiencing a downward trend).*

<LiveRateEmbed />

${discussionsHtml}

## 💡 The RemitIQ Strategy

When the market is volatile, don't rely simply on the advertised exchange rate. Providers constantly fluctuate between high-rate/high-fee vs. low-rate/zero-fee models. 

Always use our live comparison engine to calculate the actual *Total INR Received* for your specific transfer amount. By factoring in both the rate and the dynamic fee slider, you guarantee you are keeping the most money in your pocket.`

    // 4. WRITE MDX TO DISK
    console.log("💾 Writing programmatic MDX to disk...");

    const outputPath = path.join(process.cwd(), 'src/content/blog', `${slug}.mdx`);
    fs.writeFileSync(outputPath, mdxTemplate);

    console.log(`✅ Success! Generated post saved to: src/content/blog/${slug}.mdx`);
}

generateDailyPost();
