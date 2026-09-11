/* ================================================================
   Raafat Coaching — pricing.js
   حقن كروت الباقات من pricing.json داخل .pricing__cards

   المسار المتوقع لهذا الملف: src/components/pricing/pricing.js
   مسار بيانات الباقات:       src/data/pricing.json
   (لو مسار الملف مختلف غيّر مسار الـ import تحت حسب مكانه الفعلي)

   المنطق:
   - نقرأ pricing.json، ولكل باقة بنستنسخ <template id="pricing-template">
     ونعبّي فيه: اسم الباقة، السعر بالجنيه/الدولار، ملاحظة الموقع،
     قائمة المزايا (كل مزية سطر بأيقونة صح)، زرار CTA بلينك الواتساب،
     وكمان بادج + كلاس تمييز لو الباقة highlight في البيانات.
   - عدد الباقات مش هيتغيّر كتير، فمفيش نقاط/كاروسيل هنا زي التحولات
     والتقييمات — القسم أصلاً Grid ثابت على كل المقاسات.

   الاستخدام في main.js:
     import { initPricing } from './components/pricing/pricing.js';
     initPricing();
   ================================================================ */

// Vite بيدعم استيراد JSON بشكل مباشر (native ESM JSON import).
// المسار نسبي من مكان هذا الملف لمكان البيانات.
import pricingData from '/src/data/pricing.json';

/* ------------------------------------------------------------
   بناء عنصر "مزية" واحد (سطر بأيقونة صح + نص)
   ------------------------------------------------------------ */
function createFeatureItem(featureText) {
  const li = document.createElement('li');

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'icon icon--check');
  icon.setAttribute('aria-hidden', 'true');

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '/sprites/solid.svg#check');
  icon.appendChild(use);

  const span = document.createElement('span');
  span.textContent = featureText;

  li.append(icon, span);
  return li;
}

/* ------------------------------------------------------------
   بناء كارت باقة واحد من القالب + عنصر بيانات
   ------------------------------------------------------------ */
function createPricingCard(item, template) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector('.pricing__card');

  card.dataset.plan = item.id ?? '';
  card.classList.toggle('pricing__card--highlight', Boolean(item.highlight));

  const badge = card.querySelector('.pricing__badge');
  if (item.badge) {
    badge.textContent = item.badge;
    badge.hidden = false;
  }

  card.querySelector('.pricing__plan').textContent = item.plan ?? '';
  card.querySelector('.price-egp').textContent = item.priceEGP ?? '';
  card.querySelector('.pricing__price-usd-inline').textContent = item.priceUSD
    ? `$${item.priceUSD}`
    : '';
  card.querySelector('.pricing__price-location-note').textContent =
    item.locationNote ?? '';

  const featuresList = card.querySelector('.pricing__features');
  (item.features ?? []).forEach((feature) => {
    featuresList.appendChild(createFeatureItem(feature));
  });

  const ctaBtn = card.querySelector('.pricing__cta-btn');
  ctaBtn.textContent = item.ctaText ?? '';
  ctaBtn.href = item.whatsappLink ?? '#';

  // زرار "اشتراك سريع" — بيفتح نافذة اختيار طريقة الدفع لنفس الباقة
  const quickBtn = card.querySelector('.pricing__quick-btn');
  quickBtn.addEventListener('click', () => {
    openSubscribeModal({
      id: item.id ?? '',
      plan: item.plan ?? '',
      priceEGP: item.priceEGP ?? '',
    });
  });

  return fragment;
}

/* ================================================================
   نافذة "الاشتراك السريع" — منطق التحكم
   ================================================================ */

// مرجع الباقة المختارة حاليًا وطريقة الدفع المختارة، بيتحدّثوا كل ما
// حد يفتح النافذة أو يختار طريقة دفع
let currentPlan = null;
let currentMethod = null;

function getModalEls() {
  return {
    subscribeModal: document.getElementById('subscribe-modal'),
    planName: document.getElementById('subscribe-modal-plan'),
    methodsWrap: document.getElementById('subscribe-modal-methods'),
    accountBox: document.getElementById('subscribe-modal-account'),
    accountLabel: document.getElementById('subscribe-modal-account-label'),
    accountValue: document.getElementById('subscribe-modal-account-value'),
    copyBtn: document.getElementById('subscribe-modal-copy'),
    confirmBtn: document.getElementById('subscribe-modal-confirm'),
    confirmModal: document.getElementById('confirm-modal'),
    sendBtn: document.getElementById('confirm-modal-send'),
  };
}

function openModal(modalEl) {
  modalEl.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
  modalEl.hidden = true;
  // متفتحش الاسكرول تاني لو لسه في نافذة تانية شغالة
  const anyOpen = document.querySelector('.subscribe-modal:not([hidden])');
  if (!anyOpen) document.body.style.overflow = '';
}

function renderPaymentMethods(methodsWrap) {
  const methods = pricingData?.paymentMethods ?? [];
  methodsWrap.innerHTML = '';

  methods.forEach((method) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'subscribe-modal__method';
    btn.textContent = method.name;
    btn.dataset.methodId = method.id;
    btn.addEventListener('click', () => selectPaymentMethod(method));
    methodsWrap.appendChild(btn);
  });
}

function selectPaymentMethod(method) {
  currentMethod = method;
  const { methodsWrap, accountBox, accountLabel, accountValue, confirmBtn, copyBtn } = getModalEls();

  // تحديث حالة "مُختار" بصريًا على الزرار المضغوط بس
  methodsWrap.querySelectorAll('.subscribe-modal__method').forEach((btn) => {
    btn.classList.toggle('subscribe-modal__method--active', btn.dataset.methodId === method.id);
  });

  accountLabel.textContent = `حوّل على ${method.name}${method.note ? ` (${method.note})` : ''}`;
  accountValue.textContent = method.account ?? '';
  accountBox.hidden = false;
  copyBtn.textContent = 'نسخ';
  copyBtn.classList.remove('subscribe-modal__copy-btn--copied');

  confirmBtn.disabled = false;
}

function openSubscribeModal(plan) {
  currentPlan = plan;
  currentMethod = null;

  const { subscribeModal, planName, methodsWrap, accountBox, confirmBtn } = getModalEls();

  planName.textContent = `${plan.plan} — ${plan.priceEGP} جنيه`;
  accountBox.hidden = true;
  confirmBtn.disabled = true;

  renderPaymentMethods(methodsWrap);
  openModal(subscribeModal);
}

function buildWhatsappConfirmLink() {
  const number = pricingData?.whatsappNumber ?? '';
  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines = [
    'تم التحويل وعايز أفعّل اشتراكي 🔥',
    `الباقة: ${currentPlan?.plan ?? ''}`,
    `طريقة الدفع: ${currentMethod?.name ?? ''}`,
    `تاريخ التحويل: ${today}`,
    'سيتم إرفاق صورة التحويل مع هذه الرسالة.',
  ];

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${number}?text=${text}`;
}

function initSubscribeModalEvents() {
  const {
    subscribeModal, confirmModal, confirmBtn, copyBtn,
    accountValue, sendBtn,
  } = getModalEls();

  if (!subscribeModal || !confirmModal) return;

  // إغلاق أي نافذة عند الضغط على الخلفية أو زرار الإغلاق
  document.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => {
      closeModal(subscribeModal);
      closeModal(confirmModal);
    });
  });

  // الهروب بالكيبورد (Esc) يقفل أي نافذة مفتوحة
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeModal(subscribeModal);
    closeModal(confirmModal);
  });

  // نسخ رقم/حساب طريقة الدفع
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(accountValue.textContent ?? '');
      copyBtn.textContent = 'تم النسخ ✓';
      copyBtn.classList.add('subscribe-modal__copy-btn--copied');
    } catch {
      // لو الكليبورد مش متاح (متصفح قديم/إعدادات صلاحيات)، تجاهل بصمت
    }
  });

  // "تأكيد الاشتراك" — الانتقال لنافذة إرسال السكرين شوت
  confirmBtn.addEventListener('click', () => {
    if (!currentMethod) return;
    sendBtn.href = buildWhatsappConfirmLink();
    closeModal(subscribeModal);
    openModal(confirmModal);
  });
}

/* ------------------------------------------------------------
   حقن كل الباقات داخل .pricing__cards
   ------------------------------------------------------------ */
function renderPricingCards(track, template) {
  const items = pricingData?.pricing ?? [];
  if (items.length === 0) return;

  const cardsFragment = document.createDocumentFragment();
  items.forEach((item) => {
    cardsFragment.appendChild(createPricingCard(item, template));
  });

  track.appendChild(cardsFragment);
}

export function initPricing() {
  const track = document.querySelector('.pricing__cards');
  const template = document.getElementById('pricing-template');

  if (!track || !template) return;

  renderPricingCards(track, template);
  initSubscribeModalEvents();
}