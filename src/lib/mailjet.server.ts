/**
 * Mailjet HTTPS REST API v3.1 Client for PASHAN
 * Uses direct HTTPS fetch calls (Render-compatible, no SMTP ports needed)
 */

interface MailjetRecipient {
  Email: string;
  Name?: string;
}

interface SendEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendMailjetEmail({
  toEmail,
  toName = "",
  subject,
  htmlContent,
  textContent,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.warn(
      "[Mailjet Warning] MAILJET_API_KEY or MAILJET_SECRET_KEY missing in environment variables. Email logged instead of sent.",
    );
    console.log(`[Simulated Mailjet Email to ${toEmail}]: ${subject}`);
    return { success: true }; // Soft return in dev mode
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`;

  const payload = {
    Messages: [
      {
        From: {
          Email: process.env.MAILJET_SENDER_EMAIL || "pashan.support@gmail.com",
          Name: "PASHAN · Wear Your Intention",
        },

        To: [
          {
            Email: toEmail,
            Name: toName || toEmail.split("@")[0],
          },
        ],
        Subject: subject,
        HTMLPart: htmlContent,
        TextPart: textContent || htmlContent.replace(/<[^>]*>?/gm, ""),
        CustomID: "PashanNewsletterWelcome",
      },
    ],
  };

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Mailjet HTTPS API Error]:", errorData);
      return {
        success: false,
        error: errorData.ErrorMessage || `Mailjet returned status ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true };
  } catch (err: any) {
    console.error("[Mailjet Network Error]:", err);
    return { success: false, error: err.message || "Failed to reach Mailjet API" };
  }
}

/**
 * Generates PASHAN's luxury HTML Welcome Email for Wisdom Circle subscribers
 */
export function getWelcomeEmailHtml(email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Cinzel', Georgia, serif; background-color: #161817; color: #f4efea; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #1b1d1c; border: 1px solid rgba(212, 175, 55, 0.25); padding: 40px 30px; text-align: center; }
    .symbol { font-size: 28px; color: #d4af37; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 300; letter-spacing: 2px; color: #f4efea; margin-bottom: 10px; }
    .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #c4a976; margin-bottom: 30px; }
    p { font-size: 14px; line-height: 1.8; color: #d1c7bc; font-family: sans-serif; margin-bottom: 24px; }
    .offer-box { background: rgba(212, 175, 55, 0.08); border: 1px dashed #d4af37; padding: 20px; margin: 30px 0; }
    .code { font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #d4af37; }
    .footer { margin-top: 40px; font-size: 11px; color: #888; font-family: sans-serif; }
  </style>
</head>
<body>
  <div class="container">
    <div class="symbol">🪬</div>
    <div class="sub">Welcome to the Circle</div>
    <h1>WEAR YOUR INTENTION</h1>
    <p>Namaste,</p>
    <p>Thank you for subscribing to the PASHAN Wisdom Circle. You are now connected to our Himalayan-inspired releases, sacred gemstone guides, and private collector offers.</p>
    
    <div class="offer-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 6px;">Your Welcome Gift Code</div>
      <div class="code">WISDOM10</div>
      <div style="font-size: 12px; color: #c4a976; margin-top: 6px;">10% Off Your First Handcrafted Bracelet</div>
    </div>

    <p style="font-size: 12px; color: #a09589;">Each PASHAN piece is hand-knotted in Uttarakhand, blessed with intentions, and presented in custom luxury gifting packaging.</p>

    <div class="footer">
      © PASHAN · Haridwar, Uttarakhand<br>
      You are receiving this because ${email} joined the Wisdom Circle at pashan.in
    </div>
  </div>
</body>
</html>
  `;
}
