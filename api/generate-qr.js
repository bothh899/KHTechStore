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
            // ១. Auto-Login យក Token
            // ==========================================
            const loginResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: "vannvirakboth372@gmail.com",
                    password: "BOTH8994"
                })
            });

            // ចាប់កំហុសការពារបាគងបោះ HTML មកធ្វើឱ្យគាំង
            const loginText = await loginResponse.text();
            let loginData;
            try {
                loginData = JSON.parse(loginText);
            } catch (err) {
                console.error("Bakong Login Error (HTML Response):", loginText.substring(0, 200));
                return res.status(500).json({ success: false, message: "បាគង API ប្លុកការ Login របស់ Vercel (ចេញជា HTML)" });
            }

            if (loginData.responseCode !== 0) {
                return res.status(401).json({ success: false, message: "មិនអាច Login បានទេ: " + loginData.responseMessage });
            }

            const freshToken = loginData.data.token;

            // ==========================================
            // ២. បង្កើត QR Code ជាប្រាក់ដុល្លារ (USD) វិញ
            // ==========================================
            const bakongResponse = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}` 
                },
                body: JSON.stringify({
                    bakongAccountId: "virakboth_vann@bkrt", 
                    merchantName: "VIRAKBOTH VANN",
                    merchantCity: "Phnom Penh",
                    amount: amount,          // ប្រើចំនួនទឹកប្រាក់ដើម
                    currency: "USD",         // ប្តូរមក USD វិញ
                    billNumber: orderId || `ORD-${Date.now()}`
                })
            });

            const qrText = await bakongResponse.text();
            let data;
            try {
                data = JSON.parse(qrText);
            } catch (e) {
                console.error("Bakong Generate Error (HTML Response):", qrText.substring(0, 200));
                throw new Error(`បាគង API ប្លុកការបង្កើត QR របស់ Vercel (ចេញជា HTML)`);
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
