import "./logo.css";
import Image from "next/image";
import Link from "next/link";

/**
 * Icon + wordmark lockup, top-left of every surface.
 *
 * No white plate behind the icon. The artwork's own rounded square is #2A1A60
 * and every surface the lockup sits on is --tm-purple #2A1A5E — two units apart
 * in one channel, so the square disappears into the bar and only the white face
 * and red tongue read. The plate the mockup drew was adding a visible ring for
 * no contrast benefit.
 *
 * `onLight` puts the plate back, for any surface that is not the purple bar.
 * The wordmark PNG is white on transparent and ships as artwork, not a font.
 */
export default function Logo({
  iconOnly = false,
  iconSize = 34,
  wordmarkHeight = 17,
  onLight = false,
}: {
  iconOnly?: boolean;
  iconSize?: number;
  wordmarkHeight?: number;
  onLight?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Tastemakers — home"
      style={{ display: "inline-flex", alignItems: "center", gap: 9, flex: "none" }}
    >
      <span
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: Math.round(iconSize * 0.26),
          display: "flex",
          flex: "none",
          ...(onLight ? { background: "#fff", padding: 3 } : null),
        }}
      >
        <Image
          src="/brand/tm-icon.png"
          alt=""
          width={iconSize}
          height={iconSize}
          priority
          style={{
            width: "100%",
            height: "100%",
            borderRadius: onLight ? 6 : Math.round(iconSize * 0.26),
          }}
        />
      </span>
      {iconOnly ? null : (
        <Image
          className="tm-wordmark"
          src="/brand/tm-wordmark-white.png"
          alt="Tastemakers"
          width={268}
          height={43}
          priority
          style={{ height: wordmarkHeight, width: "auto" }}
        />
      )}
    </Link>
  );
}
