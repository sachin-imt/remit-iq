import { getPlatforms, calcReceived } from './src/data/platforms';

const amounts = [1000, 2000, 5000, 10000, 25000, 50000, 100000];
const midMarketRate = 64.27; // Using the value from the screenshot

console.log(`Testing with Mid-Market Rate: ₹${midMarketRate}\n`);

amounts.forEach(amount => {
    console.log(`\n========================================`);
    console.log(`Sending AUD $${amount.toLocaleString()}`);
    console.log(`========================================`);

    const platforms = getPlatforms(midMarketRate, amount);

    const results = platforms.map(p => {
        const received = calcReceived(amount, p.rate, p.fee);
        return {
            Platform: p.name,
            'Effective Rate': `₹${p.rate.toFixed(4)}`,
            'Total Fee': `$${p.fee.toFixed(2)}`,
            'You Receive': `₹${received.toLocaleString('en-IN')}`
        };
    }).sort((a, b) => parseInt(b['You Receive'].replace(/,/g, '')) - parseInt(a['You Receive'].replace(/,/g, '')));

    console.table(results);
});
