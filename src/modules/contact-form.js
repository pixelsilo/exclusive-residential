// Contact page: turns the Webflow form into one sentence.
//
//   Hello, I'm [name] from [company]. I'd like to talk to a director about
//   [a residential project ▾]. You can reach me at [email] or on [number].
//
// Progressive enhancement: the Webflow form, its inputs (names, data-names,
// autocomplete) and Turnstile stay as they are, so submissions arrive exactly as
// before. The script only moves the existing inputs into the sentence, adds a
// Topic select (sent as "Topic"), swaps the submit input for a button in the style
// of the site's .button, and checks the required blanks before Webflow sends.
// Without the script the original two-column form still works.
//
// Mount: [data-module="contact-form"] on the section that holds the form.
// Styles are in the code_css embed (contact form).

const TOPICS = [
  ['Residential', 'a residential project', 'The property, location, timings, the brief so far'],
  ['Projects', 'a commercial project', 'The site, scale, programme, the brief so far'],
  ['Aftercare', 'aftercare', 'The property and what needs looking after'],
  ['Other', 'something else', 'Tell us a little more'],
];
const MESSAGE_LABEL = 'Anything else we should know?';
const OTHER_LABEL = 'What would you like to talk about?';
const ARROW = '<svg viewBox="0 0 22 18" aria-hidden="true"><path fill="currentColor" d="M21.76 8.88c0-.29-.12-.56-.35-.78L13.64.35C13.38.09 13.14 0 12.86 0c-.58 0-1.02.42-1.02 1.01 0 .28.09.55.28.74l2.62 2.67 4.65 4.24.24-.59-3.77-.23H1.03C.42 7.84 0 8.27 0 8.88s.42 1.04 1.03 1.04h14.83l3.77-.23-.24-.58-4.65 4.23-2.62 2.67c-.19.18-.28.46-.28.74 0 .59.44 1.01 1.02 1.01.28 0 .53-.11.76-.33l7.79-7.77c.23-.22.35-.49.35-.78Z"/></svg>';
const CHEVRON = '<svg class="ecg-cf_chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5"/></svg>';

function blank(input, hint, label) {
  input.classList.add('ecg-cf_in');
  input.placeholder = hint;
  input.setAttribute('aria-label', label);
  const wrap = document.createElement('span');
  wrap.className = 'ecg-cf_blank';
  wrap.append(input);
  return wrap;
}

export default function contactForm(root) {
  const form = root.querySelector('form');
  if (!form) return;
  const f = (name) => form.querySelector(`[name="${name}"]`);
  const name = f('name');
  const company = f('Company');
  const email = f('email');
  const phone = f('Phone');
  const message = f('field');
  const submit = form.querySelector('input[type="submit"]');
  if (!name || !email || !phone || !message || !submit) return;

  root.classList.add('ecg-cf');

  // Autocomplete and phone keyboards
  name.autocomplete = 'name';
  email.autocomplete = 'email';
  email.inputMode = 'email';
  phone.autocomplete = 'tel';
  phone.inputMode = 'tel';
  if (company) { company.autocomplete = 'organization'; company.required = false; }

  // Topic select, posted with the form as "Topic"
  const topic = document.createElement('select');
  topic.name = 'Topic';
  topic.setAttribute('data-name', 'Topic');
  topic.innerHTML = TOPICS.map(([value, text]) => `<option value="${value}">${text}</option>`).join('');
  const topicWrap = blank(topic, '', 'What would you like to talk about?');
  topicWrap.classList.add('is-select');
  topicWrap.insertAdjacentHTML('beforeend', CHEVRON);

  // The sentence
  const p = document.createElement('p');
  p.className = 'ecg-cf_sentence';
  const t = (text) => document.createTextNode(text);
  p.append(t("Hello, I'm "), blank(name, 'your name', 'Your name'));
  if (company) p.append(t(' from '), blank(company, 'your company', 'Your company (optional)'));
  p.append(t(". I'd like to talk to a director about "), topicWrap,
    t('. You can reach me at '), blank(email, 'your email', 'Your email address'),
    t(' or on '), blank(phone, 'your number', 'Your phone number'), t('.'));

  // Message, with a prompt that follows the topic
  const msgWrap = document.createElement('div');
  msgWrap.className = 'ecg-cf_more';
  const msgLabel = document.createElement('label');
  msgLabel.htmlFor = message.id || 'field';
  msgLabel.textContent = MESSAGE_LABEL;
  message.classList.add('ecg-cf_msg');
  message.placeholder = TOPICS[0][2];
  const msgField = document.createElement('div');
  msgField.className = 'ecg-cf_field';
  msgField.append(msgLabel, message);

  // Submit: a button built like the site's .button (yellow square swings in, arrow slides)
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'ecg-cf_button';
  button.innerHTML = `<span class="ecg-cf_button-text">${submit.value || 'Send message'}</span><span class="ecg-cf_button-tri" aria-hidden="true"></span><span class="ecg-cf_button-icon">${ARROW}</span>`;
  submit.style.display = 'none'; // Webflow's .w-button display beats [hidden]
  const actions = document.createElement('div');
  actions.append(button);
  msgWrap.append(msgField, actions);

  // Meta line: reassurance, the error, and the existing Privacy Policy link
  const meta = document.createElement('div');
  meta.className = 'ecg-cf_meta';
  meta.innerHTML = '<span class="ecg-cf_note">Sent in confidence to our directorship team.</span><span class="ecg-cf_error" role="alert" hidden>Please fill in your name, email and number.</span>';
  const privacy = form.querySelector('a[href*="privacy"]');
  if (privacy) meta.append(privacy);

  // Replace the old layout: drop the original rows and labels, keep everything else
  // (Turnstile, Webflow's hidden bits) where Webflow put it.
  form.querySelectorAll('label').forEach((l) => l.remove());
  const firstRow = name.closest('form > *');
  form.prepend(p, msgWrap, meta);
  form.querySelectorAll(':scope > div').forEach((div) => {
    if (div !== msgWrap && div !== meta && !div.querySelector('input, textarea, select, a, iframe, .cf-turnstile, script')) div.remove();
  });
  if (firstRow && firstRow.isConnected && !firstRow.querySelector('input, textarea, select, iframe, .cf-turnstile')) firstRow.remove();
  msgField.prepend(msgLabel);

  // Kicker above the sentence, in place of the old intro column
  const intro = root.querySelector('.heading-copy');
  if (intro) {
    const kicker = document.createElement('div');
    kicker.className = 'ecg-cf_kicker';
    kicker.textContent = 'Contact our team';
    intro.replaceWith(kicker);
  }

  const error = meta.querySelector('.ecg-cf_error');

  // Size each blank to its text (or its hint while empty)
  const measure = document.createElement('span');
  measure.className = 'ecg-cf_measure';
  measure.setAttribute('aria-hidden', 'true');
  p.append(measure);
  const blanks = [...p.querySelectorAll('.ecg-cf_in')];
  const fit = (el) => {
    measure.textContent = el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : (el.value || el.placeholder);
    const extra = el.tagName === 'SELECT' ? measure.offsetHeight * 0.6 : 2;
    el.style.width = Math.ceil(measure.getBoundingClientRect().width + extra) + 'px';
  };
  const fitAll = () => blanks.forEach(fit);
  blanks.forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
    fit(el);
    el.classList.remove('is-missing');
    if (!p.querySelector('.is-missing')) error.hidden = true;
  }));
  fitAll();
  document.fonts?.ready.then(fitAll);
  // Refit when the sentence's type size changes (breakpoints, late CSS, zoom)
  let lastSize = '';
  new ResizeObserver(() => {
    const size = getComputedStyle(p).fontSize;
    if (size !== lastSize) { lastSize = size; fitAll(); }
  }).observe(p);

  topic.addEventListener('change', () => {
    const [value, , hint] = TOPICS[topic.selectedIndex];
    msgLabel.textContent = value === 'Other' ? OTHER_LABEL : MESSAGE_LABEL;
    message.placeholder = hint;
  });

  // Our own check runs before Webflow's submit handler; if anything's missing,
  // Webflow never sees the submit.
  form.noValidate = true;
  form.addEventListener('submit', (e) => {
    const missing = [name, email, phone].filter((el) => !el.value.trim() || !el.checkValidity());
    missing.forEach((el) => el.classList.add('is-missing'));
    error.hidden = !missing.length;
    if (missing.length) {
      e.preventDefault();
      e.stopImmediatePropagation();
      missing[0].focus();
    }
  }, true);
}
