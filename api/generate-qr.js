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
            // ១. Auto-Login យក Token ថ្មី (ការពារ Token ផុតកំណត់)
            // ==========================================
            const loginResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: "vannvirakboth372@gmail.com",
                    password: "BOTH8994"
                })
            });

            const loginData = await loginResponse.json();
            if (loginData.responseCode !== 0) {
                return res.status(401).json({ success: false, message: "មិនអាច Login ចូលបាគងបានទេ" });
            }

            const freshToken = loginData.data.token;

            // ==========================================
            // ២. បំប្លែងប្រាក់ដុល្លារពី App ទៅជាប្រាក់រៀល (ឧទាហរណ៍៖ $1 = 4100៛)
            // ==========================================
            const amountInKHR = Math.round(amount * 4100);

            // ==========================================
            // ៣. បង្កើត QR Code ជាលុយរៀល (KHR)
            // ==========================================
            const bakongResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}` 
                },
                body: JSON.stringify({
                    bakongAccountId: "virakboth_vann@bkrt", // ត្រឹមត្រូវហើយ!
                    merchantName: "VIRAKBOTH VANN",
                    merchantCity: "Phnom Penh",
                    amount: amountInKHR,    // ប្រើចំនួនទឹកប្រាក់ដែលគុណជាលុយរៀលរួច
                    currency: "KHR",        // កំណត់រូបិយប័ណ្ណជាលុយរៀល (116)
                    billNumber: orderId || `ORD-${Date.now()}`
                })
            });

            const textData = await bakongResponse.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (e) {
                throw new Error(`Bakong Server Error: ${textData.substring(0, 100)}`);
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
