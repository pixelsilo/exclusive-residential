// Copy button beside the footer email address (as on pixelsilo.net). The custom
// cursor makes an address hard to select by hand, so a click copies it instead.
// A small tooltip shows "Copy to clipboard" on hover or keyboard focus and
// "Copied" for a moment after a click.
//
// Styles are in the code_css embed (copy email button).

const ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9,18q-0.82,0-1.41-0.59T7,16V4Q7,3.17 7.59,2.59T9,2h9q0.82,0 1.41,0.59T20,4V16q0,0.82-0.59,1.41T18,18H9Zm0-2h9V4H9V16ZM5,22q-0.83,0-1.41-0.59T3,20V6H5V20H16v2H5Zm4-6V4V16Z"/></svg>';
const LABEL = 'Copy to clipboard';

async function write(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { /* nothing more to try */ }
    area.remove();
    return ok;
  }
}

function addButton(link) {
  const email = link.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
  const row = document.createElement('span');
  row.className = 'ecg-copy_row';
  link.replaceWith(row);
  row.append(link);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ecg-copy';
  button.setAttribute('aria-label', 'Copy email address');
  button.innerHTML = `${ICON}<span class="ecg-copy_tip" aria-hidden="true">${LABEL}</span>`;
  row.append(button);
  // Same colour as the address itself
  button.style.setProperty('--ecg-copy-color', getComputedStyle(link).color);

  // The footer's reveal animates the address with inline transform and opacity;
  // mirror them so the button rises and fades in with the text, not ahead of it.
  const follow = () => {
    ['transform', 'translate', 'opacity', 'visibility'].forEach((p) => { button.style[p] = link.style[p]; });
  };
  follow();
  new MutationObserver(follow).observe(link, { attributes: true, attributeFilter: ['style'] });

  const tip = button.querySelector('.ecg-copy_tip');
  let timer = 0, hovered = false, focused = false;
  const sync = () => tip.classList.toggle('is-visible', hovered || focused || !!timer);
  button.addEventListener('pointerenter', () => { hovered = true; sync(); });
  button.addEventListener('pointerleave', () => { hovered = false; sync(); });
  button.addEventListener('focus', () => { focused = button.matches(':focus-visible'); sync(); });
  button.addEventListener('blur', () => { focused = false; sync(); });
  button.addEventListener('click', async () => {
    if (!(await write(email))) return;
    tip.textContent = 'Copied';
    clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; tip.textContent = LABEL; sync(); }, 1800);
    sync();
  });
}

export default function copyEmail() {
  if (document.querySelector('.ecg-copy')) return;
  document.querySelectorAll('.footer a[href^="mailto:"]').forEach(addButton);
}
