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

  return fragment;
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
}