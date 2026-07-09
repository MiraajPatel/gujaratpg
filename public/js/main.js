'use strict';

/* ==========================================================================
   Ghar Bachao — front-end behaviour
   ========================================================================== */

const MAX_VIDEO_MB = 60;

/* --------------------------------------------------------------------------
   i18n — English lives in the HTML; Hindi lives here. On load we capture the
   English strings from the DOM, so the site works with JS off (English) and
   toggles to Hindi on demand.
   -------------------------------------------------------------------------- */
const HI = {
  'a11y.skip': 'सीधे अपनी कहानी साझा करें',
  'nav.issue': 'समस्या', 'nav.how': 'कैसे काम करता है', 'nav.stories': 'कहानियाँ',
  'nav.cta': 'अपनी कहानी बताएं',

  'hero.eyebrow': 'एक देशव्यापी नागरिक आंदोलन',
  'hero.title': 'उन्होंने रातोंरात हमारे घर बंद कर दिए। हम चुप नहीं रहेंगे।',
  'hero.sub': 'अहमदाबाद और अब उससे आगे भी, सोसाइटी की शिकायतों के बाद पीजी और हॉस्टल बंद किए जा रहे हैं — जिससे छात्र और कामकाजी लोग बेघर हो रहे हैं। यहाँ अपनी कहानी बताएं। मिलकर, हम इसे मीडिया, प्रशासन और पूरे देश तक पहुँचाएँगे।',
  'hero.cta1': 'अपनी कहानी बताएं', 'hero.cta2': 'कहानियाँ पढ़ें →',
  'impact.stories': 'कहानियाँ साझा हुईं', 'impact.cities': 'प्रभावित शहर',
  'impact.published': 'प्रकाशित आवाज़ें',
  'hero.card1': '“मुझे जाने के लिए 24 घंटे मिले। अगले हफ्ते मेरी परीक्षा है।”',
  'hero.card1city': 'अहमदाबाद',
  'hero.card2': '“मैं काम के लिए यहाँ आया था। अब स्टेशन पर सोता हूँ।”',
  'hero.card2city': 'अहमदाबाद',
  'hero.card3': '“उन्होंने हमारा डिपॉज़िट रखा और गेट पर ताला लगा दिया।”',
  'hero.card3city': 'अहमदाबाद',

  'issue.eyebrow': 'क्या हो रहा है',
  'issue.title': 'बिना चेतावनी बंद कर दिया गया जीने का एक पूरा तरीका।',
  'issue.lead': 'यह कुछ सोसाइटी शिकायतों से शुरू हुआ। फिर, एक-एक करके, अहमदाबाद भर के पेइंग-गेस्ट घर और हॉस्टल बंद करने के आदेश दिए गए — और यह सिलसिला दूसरे शहरों तक फैल रहा है। ये निवासी बाहरी लोग नहीं हैं। ये परीक्षा दे रहे छात्र हैं, रात की शिफ्ट करने वाली नर्सें हैं, परिवार से दूर पहली नौकरी करने वाले हैं। रातोंरात, हज़ारों को बिना नोटिस, बिना रिफंड और जाने की कोई जगह दिए सामान बाँधकर निकलने को कह दिया गया।',
  'issue.p1': '<strong>अचानक बेदखली।</strong> महीनों नहीं, घंटों के नोटिस।',
  'issue.p2': '<strong>कोई विकल्प नहीं।</strong> किफ़ायती आवास है ही नहीं।',
  'issue.p3': '<strong>ज़िंदगियाँ अस्त-व्यस्त।</strong> परीक्षा, नौकरी और सुरक्षा दांव पर।',
  'issue.p4': '<strong>कोई आवाज़ नहीं।</strong> हर निवासी अकेले लड़ता है — अब तक।',

  'how.eyebrow': 'आपकी आवाज़ कैसे ताक़त बनती है',
  'how.title': 'तीन कदम। एक साझा आवाज़।',
  'how.s1t': 'आप अपनी कहानी बताएं',
  'how.s1b': 'नीचे फ़ॉर्म भरें। हो सके तो छोटा वीडियो जोड़ें — एक चेहरा और आवाज़ शब्दों से कहीं ज़्यादा असर करती है।',
  'how.s2t': 'हम सबूत जुटाते हैं',
  'how.s2b': 'हर कहानी को एक सत्यापित रिकॉर्ड में जोड़ा जाता है — नाम, जगह और ज़मीनी हक़ीक़त का पैमाना।',
  'how.s3t': 'हम इसे सार्वजनिक करते हैं',
  'how.s3b': 'जुटाई गई आवाज़ें पत्रकारों, प्रशासन और जनता तक पहुँचती हैं — हज़ारों निजी नुकसानों को एक ऐसी कहानी में बदलती हैं जिसे नज़रअंदाज़ नहीं किया जा सकता।',

  'form.eyebrow': 'आपकी कहानी मायने रखती है',
  'form.title': 'बताएं आपके साथ क्या हुआ',
  'form.note': 'इसमें कुछ मिनट लगते हैं। आपका फ़ोन नंबर पूरी तरह निजी रखा जाता है — इसका उपयोग केवल हमारी टीम आपसे संपर्क करने के लिए करती है। आपकी अनुमति के बिना कुछ भी प्रकाशित नहीं होता।',
  'form.legend1': 'आपके बारे में',
  'form.name': 'पूरा नाम <em>*</em>', 'form.name.ph': 'आपका नाम',
  'form.phone': 'फ़ोन नंबर <em>*</em>', 'form.phone.ph': '10 अंकों का मोबाइल नंबर',
  'form.phone.hint': 'निजी रखा जाता है। सार्वजनिक रूप से कभी नहीं दिखाया जाता।',
  'form.email': 'ईमेल <span class="opt">(वैकल्पिक)</span>',
  'form.optional': '(वैकल्पिक)',
  'form.restype': 'आप हैं… <span class="opt">(वैकल्पिक)</span>',
  'form.restype.0': 'चुनें', 'form.restype.student': 'छात्र',
  'form.restype.working': 'कामकाजी पेशेवर', 'form.restype.jobseeker': 'नौकरी की तलाश / प्रशिक्षु',
  'form.restype.family': 'परिवार / अन्य',
  'form.legend2': 'आपका पीजी / हॉस्टल',
  'form.city': 'शहर <em>*</em>', 'form.state': 'राज्य <span class="opt">(वैकल्पिक)</span>',
  'form.pgname': 'पीजी / हॉस्टल का नाम <em>*</em>', 'form.pgname.ph': 'आपके पीजी / हॉस्टल का नाम',
  'form.area': 'क्षेत्र / इलाका <span class="opt">(वैकल्पिक)</span>',
  'form.duration': 'आप वहाँ कितने समय रहे? <span class="opt">(वैकल्पिक)</span>', 'form.duration.ph': 'जैसे 2 साल',
  'form.legend3': 'आप किन समस्याओं का सामना कर रहे हैं?',
  'form.problems.hint': 'जो भी लागू हो, सब चुनें।',
  'prob.eviction': 'अचानक बेदखली', 'prob.homeless': 'बेघर हो गए',
  'prob.short_notice': 'लगभग कोई नोटिस नहीं', 'prob.no_alternative': 'कोई वैकल्पिक आवास नहीं',
  'prob.studies': 'पढ़ाई / परीक्षा प्रभावित', 'prob.job': 'नौकरी / काम प्रभावित',
  'prob.financial': 'आर्थिक नुकसान', 'prob.deposit_lost': 'डिपॉज़िट वापस नहीं मिला',
  'prob.safety': 'सुरक्षा खतरे में', 'prob.health': 'स्वास्थ्य प्रभावित', 'prob.other': 'कुछ और',
  'form.legend4': 'आपकी कहानी',
  'form.story': 'बताएं क्या हुआ <em>*</em>',
  'form.story.ph': 'क्या हुआ, कब हुआ, और इसने आपकी ज़िंदगी को कैसे प्रभावित किया…',
  'form.story.hint': 'जितना असली विवरण, उतना ज़्यादा असर।',
  'form.want': 'आप क्या चाहते हैं कि हो? <span class="opt">(वैकल्पिक)</span>',
  'form.want.ph': 'आपकी माँग — जैसे स्थानांतरण के लिए समय, रिफंड, एक निष्पक्ष नीति…',
  'form.legend5': 'हमें दिखाएं (वैकल्पिक, पर असरदार)',
  'form.videoup': 'छोटा वीडियो अपलोड करें',
  'form.video.drop': 'वीडियो रिकॉर्ड करने / चुनने के लिए टैप करें',
  'form.video.sub': 'MP4, MOV, WebM · 60&nbsp;MB तक',
  'form.or': 'या', 'form.videolink': 'वीडियो लिंक पेस्ट करें',
  'form.videolink.hint': 'कहीं पोस्ट कर चुके हैं? उसका लिंक साझा करें।',
  'form.consent1': 'मैं पुष्टि करता/करती हूँ कि यह मेरा वास्तविक, सच्चा अनुभव है। <em>*</em>',
  'form.consent2': 'मैं अनुमति देता/देती हूँ कि मेरा पहला नाम, शहर, कहानी और वीडियो इस साइट पर सार्वजनिक रूप से दिखाया जाए और इस उद्देश्य के समर्थन में मीडिया के साथ साझा किया जाए। (आपका फ़ोन नंबर कभी साझा नहीं होता।)',
  'form.submit': 'मेरी कहानी साझा करें',
  'form.privacy': '🔒 आपका फ़ोन नंबर निजी रहता है। अनुमति के बिना आपको कभी प्रकाशित नहीं किया जाता।',

  'success.title': 'आपकी कहानी हमें मिल गई है।',
  'success.body': 'आपके साहस के लिए धन्यवाद। अब आप इसमें अकेले नहीं हैं — आपकी आवाज़ अब हज़ारों का हिस्सा है। इस पेज को साझा करें ताकि और लोगों की भी सुनी जाए।',
  'success.share': 'इस आंदोलन को साझा करें', 'success.another': 'एक और कहानी भेजें',

  'stories.eyebrow': 'आवाज़ों की दीवार',
  'stories.title': 'असली लोग। असली घर। असली नुकसान।',
  'stories.empty': 'पहली कहानियों की समीक्षा हो रही है और जल्द ही यहाँ दिखेंगी। पहली आवाज़ों में से एक बनें — ऊपर अपनी कहानी साझा करें।',

  'faq.title': 'आपके मन में उठने वाले सवाल',
  'faq.q1': 'क्या मेरा फ़ोन नंबर सुरक्षित है?',
  'faq.a1': 'हाँ। आपका फ़ोन नंबर और ईमेल वेबसाइट पर कभी नहीं दिखाए जाते और सार्वजनिक रूप से कभी साझा नहीं होते। केवल हमारी छोटी टीम ज़रूरत पड़ने पर आपसे संपर्क के लिए इनका उपयोग करती है।',
  'faq.q2': 'क्या मेरी कहानी सार्वजनिक की जाएगी?',
  'faq.a2': 'केवल तभी जब आप सहमति बॉक्स चुनें। तब भी, हम आपका पहला नाम और शहर दिखाते हैं — कभी आपके पूरे संपर्क विवरण नहीं। आप कभी भी इसे हटाने के लिए कह सकते हैं।',
  'faq.q3': 'क्या इसमें कोई खर्च है?',
  'faq.a3': 'नहीं। यह एक नागरिक आंदोलन है। अपनी कहानी साझा करना पूरी तरह मुफ़्त है।',
  'faq.q4': 'आप इन सभी कहानियों का क्या करेंगे?',
  'faq.a4': 'हम इन्हें एक सत्यापित रिकॉर्ड में संकलित करते हैं और पत्रकारों, जनप्रतिनिधियों और प्रशासन तक पहुँचाते हैं — ताकि जो हो रहा है उसका पैमाना नज़रअंदाज़ करना नामुमकिन हो।',

  'footer.tag': 'पूरे भारत के पीजी और हॉस्टल निवासियों के लिए एक नागरिक आंदोलन।',
  'footer.legal': 'कहानियाँ निवासियों द्वारा स्वेच्छा से साझा की जाती हैं। हम व्यक्तिगत डेटा न बेचते हैं, न उसका दुरुपयोग करते हैं।',
};

const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.getAttribute('data-i18n')] = el.innerHTML; });
document.querySelectorAll('[data-i18n-ph]').forEach((el) => { EN[el.getAttribute('data-i18n-ph')] = el.getAttribute('placeholder') || ''; });

function applyLang(lang) {
  const table = lang === 'hi' ? { ...EN, ...HI } : EN;
  Object.keys(EN).forEach((key) => {
    const val = table[key] != null ? table[key] : EN[key];
    document.querySelectorAll(`[data-i18n="${key}"]`).forEach((el) => { el.innerHTML = val; });
    document.querySelectorAll(`[data-i18n-ph="${key}"]`).forEach((el) => { el.setAttribute('placeholder', val); });
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-toggle button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.lang === lang);
  });
  try { localStorage.setItem('gb-lang', lang); } catch {}
}

function currentLang() { return document.documentElement.lang === 'hi' ? 'hi' : 'en'; }

document.querySelectorAll('.lang-toggle button').forEach((btn) => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

(function initLang() {
  let saved = 'en';
  try { saved = localStorage.getItem('gb-lang') || 'en'; } catch {}
  if (saved === 'hi') applyLang('hi');
})();

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

const MSG = {
  en: {
    RATE_LIMITED: 'You have submitted several times. Please try again later.',
    VIDEO_TOO_LARGE: `That video is over ${MAX_VIDEO_MB} MB. Please trim it or paste a link instead.`,
    UNSUPPORTED_VIDEO_TYPE: 'That file type is not supported. Use MP4, MOV or WebM.',
    VALIDATION: 'Please fill in your name, phone, city, PG name and story.',
    SERVER_ERROR: 'Something went wrong on our side. Please try again.',
    NETWORK: 'Could not connect. Check your internet and try again.',
    NEED_CONSENT: 'Please tick the box confirming this is your real experience.',
    BAD_PHONE: 'Please enter a valid 10-digit Indian mobile number.',
  },
  hi: {
    RATE_LIMITED: 'आपने कई बार भेजा है। कृपया थोड़ी देर बाद फिर कोशिश करें।',
    VIDEO_TOO_LARGE: `यह वीडियो ${MAX_VIDEO_MB} MB से बड़ा है। कृपया इसे छोटा करें या लिंक पेस्ट करें।`,
    UNSUPPORTED_VIDEO_TYPE: 'यह फ़ाइल प्रकार समर्थित नहीं है। MP4, MOV या WebM का उपयोग करें।',
    VALIDATION: 'कृपया अपना नाम, फ़ोन, शहर, पीजी नाम और कहानी भरें।',
    SERVER_ERROR: 'हमारी ओर से कुछ गड़बड़ हुई। कृपया फिर कोशिश करें।',
    NETWORK: 'कनेक्ट नहीं हो सका। अपना इंटरनेट जाँचें और फिर कोशिश करें।',
    NEED_CONSENT: 'कृपया यह पुष्टि करने वाला बॉक्स चुनें कि यह आपका वास्तविक अनुभव है।',
    BAD_PHONE: 'कृपया एक मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
  },
};
function msg(code) { return (MSG[currentLang()] || MSG.en)[code] || code; }

function validPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  let ten = d;
  if (ten.length === 12 && ten.startsWith('91')) ten = ten.slice(2);
  else if (ten.length === 11 && ten.startsWith('0')) ten = ten.slice(1);
  return /^[6-9]\d{9}$/.test(ten);
}

/* --------------------------------------------------------------------------
   Video dropzone + counter
   -------------------------------------------------------------------------- */
const dropzone = document.getElementById('dropzone');
const videoInput = document.getElementById('video-input');
const dzFile = document.getElementById('dz-file');
const statusEl = document.getElementById('form-status');

function showStatus(text, kind) {
  statusEl.textContent = text || '';
  statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
}

function renderFile(file) {
  dzFile.innerHTML = '';
  if (!file) { dzFile.hidden = true; return; }
  const name = el('span', null, `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`);
  const rm = el('button', null, '✕');
  rm.type = 'button';
  rm.setAttribute('aria-label', 'Remove video');
  rm.addEventListener('click', () => { videoInput.value = ''; renderFile(null); });
  dzFile.append(name, rm);
  dzFile.hidden = false;
}

if (videoInput) {
  videoInput.addEventListener('change', () => {
    const file = videoInput.files[0];
    if (!file) { renderFile(null); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showStatus(msg('VIDEO_TOO_LARGE'), 'err');
      videoInput.value = '';
      renderFile(null);
      return;
    }
    showStatus('', '');
    renderFile(file);
  });

  ['dragenter', 'dragover'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); })
  );
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) { videoInput.files = e.dataTransfer.files; videoInput.dispatchEvent(new Event('change')); }
  });
}

const storyArea = document.querySelector('textarea[name="story"]');
const storyCounter = document.querySelector('[data-counter="story"]');
if (storyArea && storyCounter) {
  storyArea.addEventListener('input', () => { storyCounter.textContent = String(storyArea.value.length); });
}

/* --------------------------------------------------------------------------
   Form submission
   -------------------------------------------------------------------------- */
const form = document.getElementById('story-form');
const submitBtn = document.getElementById('submit-btn');
const successBox = document.getElementById('form-success');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showStatus('', '');

    const data = new FormData(form);
    // Client-side checks with friendly messages.
    if (!form.consent_truth.checked) { showStatus(msg('NEED_CONSENT'), 'err'); form.consent_truth.focus(); return; }
    if (!validPhone(data.get('phone'))) { showStatus(msg('BAD_PHONE'), 'err'); form.phone.focus(); return; }
    const required = ['full_name', 'phone', 'city', 'pg_name', 'story'];
    for (const f of required) {
      if (!String(data.get(f) || '').trim()) { showStatus(msg('VALIDATION'), 'err'); form[f].focus(); return; }
    }
    if (!videoInput || !videoInput.files.length) data.delete('video');

    submitBtn.setAttribute('aria-busy', 'true');
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = currentLang() === 'hi' ? 'भेजा जा रहा है…' : 'Sending…';

    try {
      const res = await fetch('/api/stories', { method: 'POST', body: data });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        form.hidden = true;
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        loadStats();
        return;
      }
      showStatus(msg(json.error) || msg('SERVER_ERROR'), 'err');
    } catch (err) {
      showStatus(msg('NETWORK'), 'err');
    } finally {
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = originalLabel;
    }
  });
}

const anotherBtn = document.getElementById('another-btn');
if (anotherBtn) {
  anotherBtn.addEventListener('click', () => {
    form.reset();
    renderFile(null);
    if (storyCounter) storyCounter.textContent = '0';
    successBox.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'Ghar Bachao',
      text: 'PG & hostel residents are being evicted overnight. Share your story.',
      url: location.origin,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(location.origin); shareBtn.textContent = currentLang() === 'hi' ? 'लिंक कॉपी हुआ ✓' : 'Link copied ✓'; }
    } catch {}
  });
}

/* --------------------------------------------------------------------------
   Live stats
   -------------------------------------------------------------------------- */
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const j = await res.json();
    if (!j.ok) return;
    setCount('total', j.total);
    setCount('cities', j.cities);
    setCount('approved', j.approved);
  } catch {}
}
function setCount(key, value) {
  const node = document.querySelector(`[data-count="${key}"]`);
  if (node) node.textContent = String(value);
}

/* --------------------------------------------------------------------------
   Public stories wall
   -------------------------------------------------------------------------- */
const PROB_LABEL = {
  eviction: { en: 'Eviction', hi: 'बेदखली' },
  homeless: { en: 'Homeless', hi: 'बेघर' },
  short_notice: { en: 'No notice', hi: 'बिना नोटिस' },
  no_alternative: { en: 'No alternative', hi: 'कोई विकल्प नहीं' },
  studies: { en: 'Studies hit', hi: 'पढ़ाई प्रभावित' },
  job: { en: 'Work hit', hi: 'काम प्रभावित' },
  financial: { en: 'Financial loss', hi: 'आर्थिक नुकसान' },
  deposit_lost: { en: 'Deposit lost', hi: 'डिपॉज़िट गया' },
  safety: { en: 'Safety', hi: 'सुरक्षा' },
  health: { en: 'Health', hi: 'स्वास्थ्य' },
  other: { en: 'Other', hi: 'अन्य' },
};

async function loadStories() {
  const grid = document.getElementById('stories-grid');
  const empty = document.getElementById('stories-empty');
  if (!grid) return;
  try {
    const res = await fetch('/api/stories/public');
    const j = await res.json();
    if (!j.ok || !j.stories.length) { empty.hidden = false; return; }
    empty.hidden = true;
    grid.innerHTML = '';
    j.stories.forEach((s) => grid.appendChild(storyCard(s)));
  } catch {
    empty.hidden = false;
  }
}

function storyCard(s) {
  const card = el('article', 'story-card');

  if (s.has_video) {
    const v = document.createElement('video');
    v.controls = true;
    v.preload = 'metadata';
    v.playsInline = true;
    v.src = `/media/${encodeURIComponent(s.id)}`;
    card.appendChild(v);
  } else if (s.video_link) {
    const a = el('a', 'sc-videolink', currentLang() === 'hi' ? '▶ वीडियो देखें' : '▶ Watch their video');
    a.href = s.video_link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    card.appendChild(a);
  }

  if (Array.isArray(s.problems) && s.problems.length) {
    const tags = el('div', 'sc-tags');
    s.problems.slice(0, 4).forEach((p) => {
      const label = PROB_LABEL[p] ? PROB_LABEL[p][currentLang()] : p;
      tags.appendChild(el('span', 'sc-tag', label));
    });
    card.appendChild(tags);
  }

  const excerpt = s.story.length > 320 ? s.story.slice(0, 317) + '…' : s.story;
  card.appendChild(el('p', 'sc-quote', excerpt));

  const meta = el('div', 'sc-meta');
  const avatar = el('span', 'sc-avatar', (s.first_name || '?').charAt(0).toUpperCase());
  const who = el('span');
  who.appendChild(el('span', 'sc-name', s.first_name || 'Anonymous'));
  const place = [s.city, s.state].filter(Boolean).join(', ');
  who.appendChild(document.createTextNode(place ? ` · ${place}` : ''));
  meta.append(avatar, who);
  card.appendChild(meta);

  return card;
}

/* --------------------------------------------------------------------------
   Reveal on scroll
   -------------------------------------------------------------------------- */
(function reveals() {
  const targets = document.querySelectorAll(
    '.hero-copy, .tcard, .issue-lead-grid, .step, .form-intro, .story-form, .stories-grid, .faq-list, .stories-empty'
  );
  targets.forEach((t) => t.classList.add('reveal'));
  if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  targets.forEach((t) => io.observe(t));
})();

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
loadStats();
loadStories();
