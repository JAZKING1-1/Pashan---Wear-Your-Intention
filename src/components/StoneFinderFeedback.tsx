import { MessageSquareText, Star, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  submitStoneFinderFeedback,
  type FeedbackRelevance,
} from "@/lib/stone-finder-feedback";

interface StoneFinderFeedbackProps {
  open: boolean;
  selectedStone: string;
  exploredStones: string[];
  onOpenChange: (open: boolean) => void;
}

const relevanceOptions: {
  value: FeedbackRelevance;
  label: string;
}[] = [
  { value: "yes", label: "Yes, it helped" },
  { value: "partly", label: "Partly" },
  { value: "not-yet", label: "Not yet" },
];

export function StoneFinderFeedback({
  open,
  selectedStone,
  exploredStones,
  onOpenChange,
}: StoneFinderFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [relevance, setRelevance] = useState<FeedbackRelevance | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (!open) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating || !relevance || sending) return;

    setSending(true);
    const destination = await submitStoneFinderFeedback({
      rating,
      relevance,
      comment,
      selectedStone,
      exploredStones,
    });
    setSending(false);
    setConfirmation(
      destination === "cloud"
        ? "Thank you. Your feedback has been received."
        : "Thank you. Your feedback is saved safely on this device.",
    );
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="finder-feedback-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section
        className="finder-feedback-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finder-feedback-title"
      >
        <button
          type="button"
          className="finder-feedback-close"
          onClick={() => onOpenChange(false)}
          aria-label="Close feedback"
          title="Close feedback"
        >
          <X aria-hidden size={20} />
        </button>

        {confirmation ? (
          <div className="finder-feedback-confirmation" aria-live="polite">
            <MessageSquareText aria-hidden size={28} />
            <h2 id="finder-feedback-title">We appreciate your thoughts.</h2>
            <p>{confirmation}</p>
            <button type="button" onClick={() => onOpenChange(false)}>
              Continue exploring
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <span className="finder-feedback-kicker">A quick check-in</span>
            <h2 id="finder-feedback-title">
              Did the stone guide feel relevant to you?
            </h2>
            <p>
              Your response helps us make choosing a bracelet clearer, warmer,
              and more personal.
            </p>

            <fieldset>
              <legend>Rate the experience</legend>
              <div className="finder-rating" aria-label="Rating out of five">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= rating ? "is-active" : ""}
                    onClick={() => setRating(value)}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={value <= rating}
                  >
                    <Star aria-hidden size={22} />
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Was the guidance relevant?</legend>
              <div className="finder-relevance">
                {relevanceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={relevance === option.value ? "is-active" : ""}
                    onClick={() => setRelevance(option.value)}
                    aria-pressed={relevance === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="finder-feedback-comment">
              What could make it better? <span>Optional</span>
            </label>
            <textarea
              id="finder-feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={600}
              placeholder="Tell us what felt useful or what was missing."
            />

            <button
              type="submit"
              className="finder-feedback-submit"
              disabled={!rating || !relevance || sending}
            >
              {sending ? "Saving..." : "Share feedback"}
            </button>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
}
