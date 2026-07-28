import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { saveSubscriberToFirestore } from "./firebase.server";
import { getWelcomeEmailHtml, sendMailjetEmail } from "./mailjet.server";

// Zod validation schema for newsletter signup
const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  source: z.string().optional().default("wisdom_circle_popup"),
  // Honeypot field for bot protection (should be empty for real human users)
  b_website_hp: z.string().optional(),
});

export type SubscribeInput = z.infer<typeof newsletterSchema>;

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .validator((data: unknown) => newsletterSchema.parse(data))
  .handler(async ({ data }) => {
    const { email, source, b_website_hp } = data;

    // Honeypot Bot Defense: If the hidden honeypot field is filled, silently reject bot
    if (b_website_hp && b_website_hp.length > 0) {
      console.warn(`[Security Alert] Bot trapped in Honeypot: ${email}`);
      return {
        success: true,
        message: "Thank you for joining the Wisdom Circle!",
      };
    }

    // 1. Save to Firebase Firestore
    const dbResult = await saveSubscriberToFirestore(email, source);
    if (!dbResult.success) {
      console.error("[Newsletter Server Fn] Firebase Save Failed:", dbResult.error);
    }

    // 2. Trigger Mailjet Welcome Email over HTTPS
    const welcomeHtml = getWelcomeEmailHtml(email);
    const emailResult = await sendMailjetEmail({
      toEmail: email,
      subject: "Welcome to the PASHAN Wisdom Circle — Your Gift Code Inside",
      htmlContent: welcomeHtml,
    });

    if (!emailResult.success) {
      console.error("[Newsletter Server Fn] Mailjet Email Failed:", emailResult.error);
    }

    return {
      success: true,
      message: "Welcome to the Wisdom Circle! Your 10% gift code has been sent to your email.",
    };
  });
