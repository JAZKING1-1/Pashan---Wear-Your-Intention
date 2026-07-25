export type FeedbackRelevance = "yes" | "partly" | "not-yet";

export interface StoneFinderFeedback {
  rating: number;
  relevance: FeedbackRelevance;
  comment: string;
  selectedStone: string;
  exploredStones: string[];
}

export type FeedbackDestination = "cloud" | "device";

const STORAGE_KEY = "pashan-stone-finder-feedback";
const MAX_DEVICE_ENTRIES = 20;

const saveOnDevice = (feedback: StoneFinderFeedback) => {
  if (typeof window === "undefined") return;

  let existing: StoneFinderFeedback[] = [];
  try {
    existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      [
        ...existing,
        {
          ...feedback,
          comment: feedback.comment.slice(0, 600),
          submittedAt: new Date().toISOString(),
        },
      ].slice(-MAX_DEVICE_ENTRIES),
    ),
  );
};

export async function submitStoneFinderFeedback(
  feedback: StoneFinderFeedback,
): Promise<FeedbackDestination> {
  const configuredUrl = import.meta.env.VITE_FIREBASE_FEEDBACK_URL?.trim();

  if (configuredUrl) {
    const endpoint = configuredUrl.endsWith(".json")
      ? configuredUrl
      : `${configuredUrl.replace(/\/$/, "")}.json`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...feedback,
          comment: feedback.comment.slice(0, 600),
          source: "stone-finder-v1",
          submittedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) return "cloud";
    } catch {
      // The on-device copy below keeps feedback safe during a network outage.
    }
  }

  saveOnDevice(feedback);
  return "device";
}
