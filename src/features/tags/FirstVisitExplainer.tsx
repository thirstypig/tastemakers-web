"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tm-seen-tag-explainer";
const APP_STORE = "https://apps.apple.com/app/id1573533249";

/**
 * One-time explainer under the tag cloud.
 *
 * Restaurant pages are where cold search traffic lands, so they carry the only
 * explanation many visitors will ever see. Deliberately an inline dismissible
 * strip rather than a modal: Google demotes intrusive interstitials on mobile
 * pages arriving from search, which is exactly this page and exactly that
 * traffic.
 *
 * Renders nothing on the server and nothing on the first client paint, so it
 * can never appear for a returning visitor mid-render.
 */
export default function FirstVisitExplainer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      // Private mode or storage disabled — skip rather than nag every page.
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* nothing to do */
    }
  }

  if (!show) return null;

  return (
    <aside className="tm-firstvisit">
      <p className="tm-firstvisit-copy">
        <strong>New here?</strong> These are tag reviews — people tag what
        mattered instead of leaving a star rating, and the tags most people
        agree on show up strongest.
      </p>
      <div className="tm-firstvisit-actions">
        <a href={APP_STORE} className="tm-link" target="_blank" rel="noopener noreferrer">
          Get the app
        </a>
        <button type="button" className="tm-firstvisit-dismiss" onClick={dismiss}>
          Got it
        </button>
      </div>
    </aside>
  );
}
