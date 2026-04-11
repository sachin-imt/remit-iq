const https = require('https');
https.get('https://api.frankfurter.dev/v1/latest?base=AUD&symbols=INR', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('AUD/INR:', JSON.parse(data).rates.INR));
});
