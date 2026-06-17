// File: api/generate-qr.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { amount, orderId } = req.body;

            // ==========================================
            // ជំហានទី ១៖ ចូលគណនីដើម្បីយក Token ថ្មីរាល់ដង
            // ==========================================
            const loginResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: "vannvirakboth372@gmail.com",       // <-- ដូរត្រង់នេះ
                    password: "BOTH8994" // <-- ដូរត្រង់នេះ
                })
            });

            const loginData = await loginResponse.json();
            
            if (loginData.responseCode !== 0) {
                return res.status(401).json({ success: false, message: "មិនអាច Login ចូលបាគងបានទេ: " + loginData.responseMessage });
            }

            // ទាញយក Token ដែលទើបនឹងបង្កើតថ្មីៗ
            const freshToken = loginData.data.token;

            // ==========================================
            // ជំហានទី ២៖ ប្រើ Token ថ្មីនោះដើម្បីបង្កើត QR
            // ==========================================
            const bakongResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiYzNkNjhjOTRhMjE5NDU0OCJ9LCJpYXQiOjE3ODE3MjAwNDEsImV4cCI6MTc4OTQ5NjA0MX0.XO9Vx53t5tIHQ9tjEybmDUE3TlTY5SOqo_2LfhFmNkg` // ប្រើ Token ថ្មីដោយស្វ័យប្រវត្តិ
                },
                body: JSON.stringify({
                    bakongAccountId: "virakboth_vann@bkrt", // ប្រាកដថាឈ្មោះនេះត្រឹមត្រូវ
                    merchantName: "VIRAKBOTH VANN",
                    merchantCity: "Phnom Penh",
                    amount: amount,
                    currency: "USD",
                    billNumber: orderId || `ORD-${Date.now()}`
                })
            });

            const textData = await bakongResponse.text();
            let data;
            
            try {
                data = JSON.parse(textData);
            } catch (e) {
                throw new Error(`Bakong API ឆ្លើយតបខុសប្រក្រតី: Status ${bakongResponse.status} - ${textData.substring(0, 100)}`);
            }

            if (data.responseCode === 0) {
                res.status(200).json({ 
                    success: true, 
                    qrString: data.data.qrString, 
                    md5: data.data.md5            
                });
            } else {
                res.status(400).json({ success: false, message: data.responseMessage });
            }

        } catch (error) {
            console.error("Vercel Server Error:", error);
            res.status(500).json({ success: false, message: `បញ្ហាសេវើ: ${error.message}` });
        }
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
