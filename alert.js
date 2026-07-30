(() => {
  const bar = document.getElementById("alert-bar");
  const closeBtn = document.getElementById("close-alert-bar");
  if (!bar || !closeBtn) return;

  const COOKIE_NAME = "ps_alert_dismissed";
  const DAYS = 180;
  const VERSION = "1";

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie =
      `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  function getCookie(name) {
    const match = document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  }

  function getAlertSignature() {
    const clone = bar.cloneNode(true);
    clone.querySelector("#close-alert-bar")?.remove();
    return `${VERSION}::${clone.textContent.replace(/\s+/g, " ").trim()}`;
  }

  function showBar() {
    bar.classList.add("is-visible");
    bar.setAttribute("aria-hidden", "false");
  }

  function hideBar() {
    bar.classList.remove("is-visible");
    bar.setAttribute("aria-hidden", "true");
  }

  const currentSig = getAlertSignature();
  const dismissedSig = getCookie(COOKIE_NAME);

  if (dismissedSig !== currentSig) {
    showBar();
  }

  closeBtn.addEventListener("click", () => {
    hideBar();
    setCookie(COOKIE_NAME, currentSig, DAYS);
  });
})();