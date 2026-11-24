// Google Analytics 4, loaded only after the visitor allows "analytics" in the cookie
// banner (basic Consent Mode: nothing is sent to Google before that). The consent
// module has already defined window.gtag / dataLayer and set Consent Mode defaults.
export const GA_MEASUREMENT_ID = 'G-KC3QGD9MKE';

let loaded = false;

export default function analytics() {
  const consent = window.ecgConsent;
  if (!consent || !/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

  consent.when('analytics').then(() => {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s);
  });
}
