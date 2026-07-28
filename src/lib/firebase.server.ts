/**
 * Firebase Firestore HTTPS REST Client for PASHAN
 * Works seamlessly on Render over HTTPS without native binary or gRPC port issues
 */

interface FirestoreSubscriber {
  email: string;
  subscribedAt: string;
  source: string;
  status: string;
}

export async function saveSubscriberToFirestore(
  email: string,
  source: string = "wisdom_circle_popup",
): Promise<{ success: boolean; error?: string }> {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.warn(
      "[Firebase Warning] FIREBASE_PROJECT_ID missing in environment variables. Subscriber logged locally.",
    );
    console.log(`[Simulated Firestore Write]: Subscriber ${email} from ${source}`);
    return { success: true }; // Soft return in dev mode
  }

  // Document URL for Firestore REST API
  const docId = encodeURIComponent(email.toLowerCase().trim());
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscribers/${docId}`;

  const payload = {
    fields: {
      email: { stringValue: email.toLowerCase().trim() },
      subscribedAt: { stringValue: new Date().toISOString() },
      source: { stringValue: source },
      status: { stringValue: "active" },
    },
  };

  try {
    const response = await fetch(firestoreUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Firestore HTTPS API Error]:", errorData);
      return {
        success: false,
        error: errorData.error?.message || `Firestore returned status ${response.status}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Firestore Network Error]:", err);
    return { success: false, error: err.message || "Failed to reach Firestore API" };
  }
}
