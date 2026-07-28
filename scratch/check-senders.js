import fs from 'fs';
import path from 'path';

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
const authHeader = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`;

async function checkSenders() {
  try {
    const res = await fetch("https://api.mailjet.com/v3/REST/sender", {
      headers: { Authorization: authHeader }
    });
    const data = await res.json();
    console.log("Verified Senders in Mailjet Account:");
    console.log(JSON.stringify(data.Data, null, 2));
  } catch (err) {
    console.error("Error checking senders:", err);
  }
}

checkSenders();
