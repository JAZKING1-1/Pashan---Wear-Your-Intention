import { useEffect, useRef, useState } from "react";
import openingLogo from "@/assets/pashan-logo-transparent.png";

const SESSION_KEY = "pashan-opening-seen-v5";

export function OpeningRitual() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const previousOverflow = useRef("");

  const restoreBody = () => {
    document.body.style.overflow = previousOverflow.current;
  };

  const finish = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
    setLeaving(true);
    window.setTimeout(() => {
      restoreBody();
      setVisible(false);
    }, 700);
  };

  useEffect(() => {
    let hasSeen = false;
    try {
      hasSeen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
    if (hasSeen) {
      setVisible(false);
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const exitTimer = window.setTimeout(
      () => setLeaving(true),
      reduced ? 450 : 3200,
    );
    const doneTimer = window.setTimeout(
      () => {
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // Storage can be unavailable in privacy-restricted browsers.
        }
        restoreBody();
        setVisible(false);
      },
      reduced ? 850 : 4150,
    );

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      restoreBody();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`opening-ritual ${leaving ? "is-leaving" : ""}`}
      role="dialog"
      aria-label="Welcome to PASHAN"
      aria-modal="true"
    >
      <div className="ritual-veil" aria-hidden />
      <div className="ritual-halo" />
      <div className="ritual-stars" aria-hidden="true" />
      <div className="ritual-border" aria-hidden="true" />
      <div className="ritual-logo-wrap" aria-live="polite">
        <div className="ritual-logo-panel">
          <img
            src={openingLogo}
            alt="Pashan logo"
            className="ritual-logo-image"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
              background: 'transparent'
            }}
          />
        </div>
        <div className="ritual-mantra" lang="hi">
          पाषाण
        </div>
        <p>Rooted in nature. Aligned in spirit.</p>
        <div className="ritual-beads" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <button type="button" onClick={finish} className="ritual-skip">
        Explore PASHAN
      </button>
    </div>
  );
}
