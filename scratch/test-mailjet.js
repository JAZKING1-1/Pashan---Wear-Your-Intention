import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET_KEY;
const senderEmail = process.env.MAILJET_SENDER_EMAIL || "care@pashan.in";
const recipientEmail = process.argv[2] || "devansh.sharma@pashan.in";

console.log("-----------------------------------------");
console.log("Testing Mailjet HTTPS REST API...");
console.log("API Key:", apiKey ? `${apiKey.substring(0, 6)}...` : "MISSING");
console.log("Secret Key:", secretKey ? `${secretKey.substring(0, 6)}...` : "MISSING");
console.log("Sender:", senderEmail);
console.log("Recipient:", recipientEmail);
console.log("-----------------------------------------");

const authHeader = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`;

const payload = {
  Messages: [
    {
      From: {
        Email: senderEmail,
        Name: "PASHAN · Wear Your Intention",
      },
      To: [
        {
          Email: recipientEmail,
          Name: "Valued Client",
        },
      ],
      Subject: "🪬 Welcome to PASHAN — Live Test Email",
      HTMLPart: `
        <div style="font-family: serif; background: #161817; color: #f4efea; padding: 40px; text-align: center;">
          <h1 style="color: #d4af37; letter-spacing: 2px;">WEAR YOUR INTENTION</h1>
          <p style="color: #d1c7bc; font-size: 15px;">This is a live test email sent directly via Mailjet HTTPS REST API.</p>
          <div style="background: rgba(212,175,55,0.1); border: 1px dashed #d4af37; padding: 20px; margin: 20px 0;">
            <span style="font-size: 11px; text-transform: uppercase; color: #888;">Your Welcome Gift</span><br>
            <strong style="font-size: 24px; color: #d4af37; letter-spacing: 4px;">WISDOM10</strong>
          </div>
          <p style="font-size: 12px; color: #888;"> Uttarakhand, India · PASHAN</p>
        </div>
      `,
      TextPart: "Welcome to PASHAN. Your code: WISDOM10",
      CustomID: "PashanLiveTest",
    },
  ],
};

async function testSend() {
  try {
    const res = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    console.log("HTTP Status:", res.status);
    console.log("Response Body:", JSON.stringify(body, null, 2));

    if (res.ok && body.Messages?.[0]?.Status === "success") {
      console.log("\n✅ SUCCESS! Email dispatched via Mailjet HTTPS API.");
    } else {
      console.log("\n⚠️ Note: Mailjet API response received.");
    }
  } catch (err) {
    console.error("❌ Error sending request:", err);
  }
}

testSend();
