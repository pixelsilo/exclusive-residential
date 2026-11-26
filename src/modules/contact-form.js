// Contact page: the conversational form's extras.
//
//   Hello, I'm [name] from [company]. I'd like to talk to a director about
//   [a residential project ▾]. You can reach me at [email] or on [number].
//
// The sentence is built in Webflow (so the Designer shows it): .cf_sentence holds
// .cf_text runs and .cf_blank wrappers, each with a .cf_input (the Topic select is
// in .cf_blank.is-select). Without this script it still reads and sends; the
// blanks just keep a fixed width. This adds:
//   - each blank sized to its text (or its hint while empty)
//   - the message label and hint following the chosen topic
//   - a check of name, email and phone before Webflow sends, with [data-cf="error"]
//   - the Send button built like the site's .button (yellow square swings in,
//     arrow slides); Webflow's submit input can't hold those, so it's swapped
//
// Mount: [data-module="contact-form"] on the section that holds the form.
// Styles are in the code_css embed (contact form).

const PROMPTS = {
  Residential: ['Anything else we should know?', 'The property, location, timings, the brief so far'],
  Projects: ['Anything else we should know?', 'The site, scale, programme, the brief so far'],
  Aftercare: ['Anything else we should know?', 'The property and what needs looking after'],
  Other: ['What would you like to talk about?', 'Tell us a little more'],
};
const ARROW = '<svg viewBox="0 0 22 18" aria-hidden="true"><path fill="currentColor" d="M21.76 8.88c0-.29-.12-.56-.35-.78L13.64.35C13.38.09 13.14 0 12.86 0c-.58 0-1.02.42-1.02 1.01 0 .28.09.55.28.74l2.62 2.67 4.65 4.24.24-.59-3.77-.23H1.03C.42 7.84 0 8.27 0 8.88s.42 1.04 1.03 1.04h14.83l3.77-.23-.24-.58-4.65 4.23-2.62 2.67c-.19.18-.28.46-.28.74 0 .59.44 1.01 1.02 1.01.28 0 .53-.11.76-.33l7.79-7.77c.23-.22.35-.49.35-.78Z"/></svg>';

export default function contactForm(root) {
  const form = root.querySelector('form');
  const sentence = root.querySelector('[data-cf="sentence"]');
  if (!form || !sentence) return;
  const f = (name) => form.querySelector(`[name="${name}"]`);
  const required = ['Name', 'Email', 'Phone'].map(f).filter(Boolean);
  const topic = f('Topic');
  const message = f('Message');
  const messageLabel = root.querySelector('[data-cf="message-label"]');
  const error = root.querySelector('[data-cf="error"]');
  if (messageLabel && message?.id) messageLabel.htmlFor = message.id; // Webflow leaves for=""

  // Published HTML has line breaks between the sentence's parts, which render as
  // extra spaces on top of the blanks' own margins; the Designer has none. Drop
  // them so the live page spaces exactly as the Designer shows.
  [...sentence.childNodes].forEach((n) => { if (n.nodeType === 3 && !n.textContent.trim()) n.remove(); });

  // Size each blank to its text (or its hint while empty)
  const measure = document.createElement('span');
  measure.className = 'cf_measure';
  measure.setAttribute('aria-hidden', 'true');
  sentence.append(measure);
  const blanks = [...sentence.querySelectorAll('.cf_input')];
  const fit = (el) => {
    measure.textContent = el.tagName === 'SELECT' ? el.options[el.selectedIndex]?.text || '' : (el.value || el.placeholder);
    const extra = el.tagName === 'SELECT' ? measure.offsetHeight * 0.6 : 2;
    el.style.width = Math.ceil(measure.getBoundingClientRect().width + extra) + 'px';
  };
  const fitAll = () => blanks.forEach(fit);
  blanks.forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
    fit(el);
    el.classList.remove('is-missing');
    if (error && !sentence.querySelector('.is-missing')) error.classList.remove('is-on');
  }));
  fitAll();
  document.fonts?.ready.then(fitAll);
  // Refit when the sentence's type size changes (breakpoints, late CSS, zoom)
  let lastSize = '';
  new ResizeObserver(() => {
    const size = getComputedStyle(sentence).fontSize;
    if (size !== lastSize) { lastSize = size; fitAll(); }
  }).observe(sentence);

  // The message prompt follows the topic
  if (topic && message) {
    const sync = () => {
      const [label, hint] = PROMPTS[topic.value] || PROMPTS.Residential;
      if (messageLabel) messageLabel.textContent = label;
      message.placeholder = hint;
    };
    topic.addEventListener('change', sync);
    sync();
  }

  // Send: a button in the style of .button in place of Webflow's submit input.
  // Webflow (and Turnstile) still drive the form; they disable [type=submit]
  // until the spam check passes, which covers this button too.
  const submit = form.querySelector('input[type="submit"]');
  if (submit) {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'ecg-cf_button';
    button.innerHTML = `<span class="ecg-cf_button-text">${submit.value || 'Send message'}</span><span class="ecg-cf_button-tri" aria-hidden="true"></span><span class="ecg-cf_button-icon">${ARROW}</span>`;
    submit.after(button);
    submit.style.display = 'none'; // Webflow's .w-button display beats [hidden]
  }

  // Our own check runs before Webflow's submit handler; if anything's missing,
  // Webflow never sees the submit.
  form.noValidate = true;
  form.addEventListener('submit', (e) => {
    const missing = required.filter((el) => !el.value.trim() || !el.checkValidity());
    missing.forEach((el) => el.classList.add('is-missing'));
    error?.classList.toggle('is-on', missing.length > 0);
    if (missing.length) {
      e.preventDefault();
      e.stopImmediatePropagation();
      missing[0].focus();
      return;
    }
    // Personalise the thank-you with their first name
    const first = f('Name')?.value.trim().split(/\s+/)[0];
    root.querySelectorAll('[data-cf="done-name"]').forEach((s) => { s.textContent = first ? `, ${first}` : ''; });
  }, true);

  // When Webflow shows the thank-you, bring it into view and ease it in
  const done = root.querySelector('.w-form-done');
  if (done) {
    new MutationObserver(() => {
      if (getComputedStyle(done).display === 'none' || done.dataset.shown) return;
      done.dataset.shown = '1';
      window.lenis?.resize?.();
      const top = done.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        const y = window.scrollY + top - window.innerHeight * 0.25;
        window.lenis ? window.lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' });
      }
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        [...done.querySelectorAll('.cf_done > *')].forEach((el, i) => el.animate(
          [{ opacity: 0, transform: 'translateY(1.25rem)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, delay: 120 * i, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' },
        ));
      }
    }).observe(done, { attributes: true, attributeFilter: ['style'] });
  }
}
