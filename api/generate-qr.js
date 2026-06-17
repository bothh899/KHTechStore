// File: api/generate-qr.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { amount, orderId } = req.body;

            // ប្រើ Token ដែលអ្នកបានផ្តល់ឱ្យ (ដាក់បញ្ចូលផ្ទាល់)
            const myToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiYzNkNjhjOTRhMjE5NDU0OCJ9LCJpYXQiOjE3ODE3MjAwNDEsImV4cCI6MTc4OTQ5NjA0MX0.XO9Vx53t5tIHQ9tjEybmDUE3TlTY5SOqo_2LfhFmNkg";

            const bakongResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ដាក់ Token ចូលនៅទីនេះ
                    'Authorization': 'Bearer ' + myToken
                },
                body: JSON.stringify({
                    bakongAccountId: "virakboth_vann@bkrt",
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
                throw new Error(`Bakong API ឆ្លើយតបខុសប្រក្រតី: Status ${bakongResponse.status}`);
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
