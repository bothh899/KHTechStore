// File: api/generate-qr.js

export default async function handler(req, res) {
    // ១. កំណត់ CORS ដើម្បីអនុញ្ញាតឱ្យ Android App អាចហៅ API នេះបានដោយគ្មានបញ្ហា
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // បិទបញ្ចប់សំណើ OPTIONS (Preflight Request)
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ២. ដំណើរការតែសំណើប្រភេទ POST ប៉ុណ្ណោះ
    if (req.method === 'POST') {
        try {
            // ទទួលទិន្នន័យ (តម្លៃ និង លេខកូដទំនិញ) ពី Android App
            const { amount, orderId } = req.body;

            // ៣. បាញ់សំណើទៅកាន់ Bakong API
            const bakongResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ចំណាំសំខាន់៖ ត្រូវតែមានពាក្យ "Bearer " នៅពីមុខ Token ជានិច្ច!
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiYzNkNjhjOTRhMjE5NDU0OCJ9LCJpYXQiOjE3ODE3MjAwNDEsImV4cCI6MTc4OTQ5NjA0MX0.XO9Vx53t5tIHQ9tjEybmDUE3TlTY5SOqo_2LfhFmNkg'
                },
                body: JSON.stringify({
                    bakongAccountId: "virakboth_vann@bkrt", 
                    merchantName: "KH Tech Store",
                    merchantCity: "Phnom Penh",
                    amount: amount,
                    currency: "USD",
                    billNumber: orderId
                })
            });

            const data = await bakongResponse.json();

            // ៤. បោះរូបភាព QR Code (Base64) និងលេខ MD5 ត្រឡប់ទៅ Android App វិញ
            if (data.responseCode === 0) {
                res.status(200).json({ 
                    success: true, 
                    qrString: data.data.qrString, // រូបភាព Base64 សម្រាប់បង្ហាញ
                    md5: data.data.md5            // លេខកូដសម្រាប់ឆែកមើលលុយចូលពេលក្រោយ
                });
            } else {
                res.status(400).json({ success: false, message: data.responseMessage });
            }

        } catch (error) {
            console.error("Bakong API Error:", error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
