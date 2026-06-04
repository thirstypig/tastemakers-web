"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Renders a single AdSense Display unit. Reserves `minHeight` so the page
// doesn't shift (CLS) when the ad fills in. Renders nothing while ADS_ENABLED
// is false or no slot is provided, so it's safe to ship before approval.
export function AdUnit({
  slot,
  minHeight = 280,
}: {
  slot: string;
  minHeight?: number;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle.js not loaded yet or blocked by the browser — safe no-op.
    }
  }, [slot]);

  if (!ADS_ENABLED || !slot) return null;

  return (
    <div style={{ margin: "32px auto", maxWidth: 970, textAlign: "center" }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#8b81a3",
          marginBottom: 6,
        }}
      >
        Advertisement
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
