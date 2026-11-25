// GSAP SplitText (Webflow Interactions) wraps every word and letter of an
// animated heading in inline-blocks, so a word wider than its box used to break
// between letters ("Uncompromisi/ng" in narrow tablet columns). The code_css embed
// sets `.gsap_split_word { white-space: nowrap }`, so words no longer break.
// This shrinks a split heading's font just enough that its longest word fits
// instead of overflowing. Headings that already fit, or aren't split, are left alone.
function contentWidth(el) {
  const cs = getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

function longestWord(el) {
  let max = 0;
  el.querySelectorAll('.gsap_split_word').forEach((w) => {
    const prev = w.style.whiteSpace;
    w.style.whiteSpace = 'nowrap';
    max = Math.max(max, w.getBoundingClientRect().width);
    w.style.whiteSpace = prev;
  });
  return max;
}

function fit() {
  const headings = new Set();
  document.querySelectorAll('.gsap_split_word').forEach((w) => {
    const h = w.closest('h1, h2, h3, h4, h5, h6, .heading');
    if (h) headings.add(h);
  });
  headings.forEach((el) => {
    if (el.dataset.fit !== undefined) el.style.fontSize = ''; // re-measure from the designed size
    const avail = contentWidth(el);
    const word = longestWord(el);
    if (avail <= 0 || word <= avail + 1) {
      delete el.dataset.fit;
      return;
    }
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor(size * (avail / word) * 0.98 * 10) / 10}px`;
    el.dataset.fit = '';
  });
}

export default function headingFit() {
  // SplitText runs on page load, after webfonts, so check a few times early on
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', () => {
    fit();
    setTimeout(fit, 500);
  });
  let t;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return; // ignore mobile URL-bar height changes
    lastWidth = window.innerWidth;
    clearTimeout(t);
    t = setTimeout(fit, 150);
  });
}
