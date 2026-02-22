// test-wise-api.ts
async function testWise() {
    const amount = 2000;
    // This is a known public Wise endpoint often used for quotes
    const url = `https://wise.com/gateway/v3/quotes/`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceCurrency: "AUD",
                targetCurrency: "INR",
                sourceAmount: amount,
                targetAmount: null,
                profile: null,
                guaranteedTargetAmount: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Wise API Success:", JSON.stringify(data, null, 2));
        } else {
            console.log("Wise API Failed:", response.status, await response.text());
        }
    } catch (error) {
        console.error("Error fetching Wise:", error);
    }
}

testWise();
