// File: api/generate-qr.js

export default async function handler(req, res) {
    // អនុញ្ញាតឱ្យ Android App ហៅមកបាន (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            // ទទួលទិន្នន័យ (តម្លៃ និង លេខកូដទំនិញ) ពី Android App
            const { amount, orderId } = req.body;

            // បាញ់សំណើទៅកាន់ Bakong API
            const bakongResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ដាក់ Token របស់អ្នកនៅទីនេះ
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiYzNkNjhjOTRhMjE5NDU0OCJ9LCJpYXQiOjE3ODE3MjAwNDEsImV4cCI6MTc4OTQ5NjA0MX0.XO9Vx53t5tIHQ9tjEybmDUE3TlTY5SOqo_2LfhFmNkg'
                },
                body: JSON.stringify({
                    bakongAccountId: "virakboth_vann@bkrt", // ឧទាហរណ៍: khtech@aba
                    merchantName: "KH Tech Store",
                    merchantCity: "Phnom Penh",
                    amount: amount,
                    currency: "USD",
                    billNumber: orderId
                })
            });

            const data = await bakongResponse.json();

            // បោះរូបភាព QR Code និងលេខ MD5 ត្រឡប់ទៅ Android App វិញ
            if (data.responseCode === 0) {
                res.status(200).json({ 
                    success: true, 
                    qrString: data.data.qrString, // រូបភាព Base64
                    md5: data.data.md5            // ទុកសម្រាប់ឆែកមើលលុយចូល
                });
            } else {
                res.status(400).json({ success: false, message: data.responseMessage });
            }

        } catch (error) {
            res.status(500).json({ success: false, message: "Server Error" });
        }
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
