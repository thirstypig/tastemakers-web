import Script from "next/script";
import { ADSENSE_CLIENT } from "@/lib/ads";

const GA_ID = "G-062TFF0ZGE";

// EEA + UK + Switzerland. Consent Mode v2 defaults to denied in these regions
// until Google's "Privacy & messaging" consent message resolves. Outside this
// list (e.g. the US) measurement defaults to granted; California CCPA opt-out
// is handled by the separate CCPA message.
const CONSENT_DENIED_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "GB", "CH",
];

export function Analytics() {
  return (
    <>
      {/* Consent Mode v2 defaults + GA4 config — one synchronous block so the
          dataLayer queue is ordered (deny-by-default before any hit) before
          gtag.js loads. */}
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            region: ${JSON.stringify(CONSENT_DENIED_REGIONS)},
            wait_for_update: 500
          });
          gtag('set', 'ads_data_redaction', true);
          gtag('set', 'url_passthrough', true);
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>

      {/* GA4 library */}
      <Script
        id="ga4-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />

      {/* Google AdSense — also delivers the "Privacy & messaging" consent CMP */}
      <Script
        id="adsense-lib"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
      />
    </>
  );
}
