/* ================================================================
   Raafat Coaching — transformations.js
   حقن كروت "قبل / بعد" من transformations.json + كاروسيل أفقي
   ونقاط تنقّل متزامنة مع السكرول

   المسار المتوقع لهذا الملف: src/components/transformations/transformations.js
   مسار بيانات الكروت:        src/data/transformations.json
   (لو مسار الملف مختلف غيّر مسار الـ import تحت حسب مكانه الفعلي)

   المنطق:
   0. حقن الكروت: بنقرأ transformations.json، وبنستنسخ <template id="card-template">
      لكل عنصر، ونعبّي فيه الصور (avif/webp/jpg) والـ alt، ثم نحقنه
      داخل .transformations__cards.
   1. الضغط على نقطة -> سكرول سلس للكارت المطابق.
   2. Scroll Spy: أثناء السحب، الكارت اللي أعلى نسبة ظهور في منطقة
      الكاروسيل هو اللي بتتفعّل نقطته تلقائيًا.

   ملاحظة: عدد النقاط في الـ HTML ثابت (3) ومطابق لعدد عناصر JSON،
   فمفيش داعي لتوليدها ديناميكيًا هنا (بعكس آراء العملاء).

   الاستخدام في main.js:
     import { inittransformations } from './components/transformations/transformations.js';
     inittransformations();
   ================================================================ */

// Vite بيدعم استيراد JSON بشكل مباشر (native ESM JSON import).
// المسار نسبي من مكان هذا الملف لمكان البيانات.
import transformationsData from '/src/data/transformations.json';

/* ------------------------------------------------------------
   0-أ) بناء كارت واحد من القالب + عنصر بيانات
   ------------------------------------------------------------ */
function fillPicture(card, prefix, srcTemplate, alt) {
  const avifSource = card.querySelector(`.img-${prefix}-avif`);
  const webpSource = card.querySelector(`.img-${prefix}-webp`);
  const jpgImg = card.querySelector(`.img-${prefix}-jpg`);

  if (!srcTemplate) return; // حماية لو الصورة مش موجودة في البيانات

  avifSource.srcset = srcTemplate.replace('{{extension}}', 'avif');
  webpSource.srcset = srcTemplate.replace('{{extension}}', 'webp');
  jpgImg.src = srcTemplate.replace('{{extension}}', 'jpg');
  jpgImg.alt = alt ?? '';
}

function createTransformCard(item, template) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector('.transformations__card');

  card.dataset.transform = String(item.id);

  fillPicture(card, 'before', item.beforeImage, item.beforeAlt);
  fillPicture(card, 'after', item.afterImage, item.afterAlt);

  // تعبئة النص التعريفي (الاسم + المدة) الظاهر تحت الصورة
  const nameEl = card.querySelector('.transformations__meta-name');
  const durationEl = card.querySelector('.transformations__meta-duration');
  if (nameEl) nameEl.textContent = item.name ?? '';
  if (durationEl) durationEl.textContent = item.duration ?? '';

  return fragment;
}

/* ------------------------------------------------------------
   0-ب) حقن كل الكروت داخل .transformations__cards
   ------------------------------------------------------------ */
function renderTransformCards(track, template) {
  const items = transformationsData?.transformations ?? [];
  if (items.length === 0) return;

  const listFragment = document.createDocumentFragment();
  items.forEach((item) => {
    listFragment.appendChild(createTransformCard(item, template));
  });

  track.appendChild(listFragment);
}

export function inittransformations() {
  const track = document.querySelector('.transformations__cards');
  const template = document.getElementById('card-template');
  const dots = [...document.querySelectorAll('.transformations__dot')];

  if (!track || !template || dots.length === 0) return;

  // نحقن الكروت أولًا، وبعدين نقرأها من الـ DOM عشان نربطها بالنقاط
  renderTransformCards(track, template);
  const cards = [...track.querySelectorAll('.transformations__card')];

  if (cards.length === 0) return;

  /* ------------------------------------------------------------
     1) الضغط على نقطة -> سكرول للكارت المطابق
     ------------------------------------------------------------ */
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      cards[index]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });
  });

  /* ------------------------------------------------------------
     2) Scroll Spy — تفعيل النقطة المطابقة للكارت الأكثر ظهورًا حاليًا
     ------------------------------------------------------------ */
  const setActiveDot = (activeIndex) => {
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('transformations__dot--active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  };

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      // من بين الكروت المتقاطعة حاليًا مع منطقة الكاروسيل، ناخد
      // الأعلى نسبة ظهور (يعني الأقرب فعليًا لمنتصف الشاشة)
      const mostVisibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!mostVisibleEntry) return;

      const activeIndex = cards.indexOf(mostVisibleEntry.target);
      if (activeIndex !== -1) setActiveDot(activeIndex);
    },
    {
      root: track,
      threshold: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
    }
  );

  cards.forEach((card) => scrollObserver.observe(card));
}