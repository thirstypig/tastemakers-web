"use client";

// Re-opens Google's "Privacy & messaging" consent message so a visitor can
// change their choice. Only works once the consent message is published in
// AdSense → Privacy & messaging (otherwise googlefc is undefined and this is
// a no-op).
type GoogleFc = { showRevocationMessage?: () => void };

export function PrivacySettings() {
  return (
    <button
      type="button"
      onClick={() => {
        const fc = (window as unknown as { googlefc?: GoogleFc }).googlefc;
        fc?.showRevocationMessage?.();
      }}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        font: "inherit",
        color: "#8b81a3",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      Privacy settings
    </button>
  );
}
