import { useEffect, useState } from "react";
import { Play, Pause, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { LeafDivider } from "./CraftOrnaments";
import "@/styles-ritual.css";

const stories = [
  {
    name: "Ganesha",
    title: "The courage to begin.",
    label: "New beginnings",
    body: "In Hindu tradition, Ganesha is associated with beginnings and the removal of obstacles. Our reflection: begin with one deliberate, manageable step.",
    question: "What have you been waiting to begin?",
    source: "https://www.metmuseum.org/exhibitions/ganesha",
  },
  {
    name: "Shiva",
    title: "Make room for stillness.",
    label: "Stillness & change",
    body: "Shiva appears in many forms in Hindu art, including the meditator and the cosmic dancer. Our reflection: pause, notice what changes, and return to what matters.",
    question: "What can you set down for a moment?",
    source: "https://www.metmuseum.org/art/collection/search/39328",
  },
  {
    name: "Lakshmi",
    title: "Notice what you can share.",
    label: "Gratitude & generosity",
    body: "Lakshmi is associated with prosperity and often represented with lotuses. Our reflection: appreciate what sustains you, and find a small way to be generous.",
    question: "What are you grateful for today?",
    source: "https://www.metmuseum.org/art/collection/search/78910",
  },
] as const;

export function SacredStories() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const systemReduced = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const reduced = motionReady && systemReduced;
  useEffect(() => setMotionReady(true), []);
  const story = stories[selected];
  useEffect(() => {
    if (reduced) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const timer = window.setTimeout(() => setPlaying(false), 2400);
    return () => window.clearTimeout(timer);
  }, [playing, reduced]);
  return (
    <section
      className="sacred-stories"
      aria-labelledby="sacred-title"
      lang="en"
      dir="ltr"
    >
      <div className="ritual-container">
        <div className="sacred-heading">
          <div>
            <p className="ritual-kicker">
              A living tradition. A personal reflection.
            </p>
            <h2 id="sacred-title">Stories we carry.</h2>
          </div>
          <p>
            Pause with the imagery of Ganesha, Shiva and Lakshmi. Explore a
            story, then make its reflection your own.
          </p>
        </div>
        <div className={"sacred-art" + (playing ? " is-playing" : "")}>
          <img
            src="/images/ritual/devotional-triptych-768.webp"
            srcSet="/images/ritual/devotional-triptych-768.webp 768w, /images/ritual/devotional-triptych-1440.webp 1440w"
            sizes="(max-width: 768px) 95vw, 1100px"
            width="1536"
            height="1024"
            loading="lazy"
            decoding="async"
            alt="Original generated devotional illustration of Ganesha, meditating Shiva and Lakshmi in three botanical archways"
          />
          <div className="sacred-art-light" aria-hidden="true" />
          <span
            className="sacred-art-marker"
            style={{ transform: "translateX(" + selected * 100 + "%)" }}
            aria-hidden="true"
          />
        </div>
        <div className="sacred-controls">
          <div
            className="sacred-choices"
            role="group"
            aria-label="Explore a deity's story"
          >
            {stories.map((item, index) => (
              <button
                type="button"
                key={item.name}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <span>{item.name}</span>
                <small>{item.label}</small>
              </button>
            ))}
          </div>
          <button
            className="sacred-play"
            type="button"
            onClick={() => setPlaying((value) => !reduced && !value)}
            disabled={!!reduced}
          >
            {playing ? (
              <Pause size={16} aria-hidden="true" />
            ) : (
              <Play size={16} aria-hidden="true" />
            )}
            {reduced
              ? "Motion off"
              : playing
                ? "Pause artwork"
                : "Play artwork"}
          </button>
        </div>
        <div className="sacred-story">
          <div>
            <p className="ritual-kicker">{story.name}</p>
            <h3>{story.title}</h3>
          </div>
          <div>
            <p>{story.body}</p>
            <blockquote aria-live="polite">{story.question}</blockquote>
            <a href={story.source} target="_blank" rel="noreferrer">
              Explore the cultural context{" "}
              <ArrowUpRight aria-hidden="true" size={14} />
            </a>
          </div>
        </div>
        <LeafDivider className="sacred-divider" />
        <p className="sacred-footnote">
          Original AI-generated devotional artwork, presented respectfully.
          These are cultural stories and editorial reflections, not predictions,
          blessings for sale or promises about a product.
        </p>
      </div>
    </section>
  );
}
