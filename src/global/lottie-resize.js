// Webflow's Lottie animations don't resize with the window on their own.
export default function lottieResize() {
  const lottie = window.Webflow?.require?.('lottie')?.lottie;
  if (!lottie) return;
  window.addEventListener('resize', () => lottie.resize());
}
