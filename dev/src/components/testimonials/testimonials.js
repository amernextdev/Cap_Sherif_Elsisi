/* ================================================================
   Raafat Coaching — testimonials.js
   كاروسيل التقييمات الأفقي (على الموبايل/التابلت) + نقاط تنقّل
   متزامنة مع السكرول

   الفرق عن transforms.js: عدد التقييمات مش ثابت (بيتحقن من مصدر
   بيانات خارجي)، فالنقاط بتتولّد ديناميكيًا بنفس العدد الفعلي بدل
   ما تكون مكتوبة يدويًا في الـ HTML.

   خارج نطاق الملف ده حاليًا: منطق زرار "عرض المزيد / عرض أقل"
   الخاص بعرض الديسكتوب (.testimonials__more-btn) — هيتضاف في تحديث منفصل.

   الاستخدام في main.js:
     import { initTestimonials } from './components/testimonials/testimonials.js';
     initTestimonials();
   ================================================================ */

// Vite بيدعم استيراد JSON بشكل مباشر (native ESM JSON import).
// المسار نسبي من مكان هذا الملف لمكان البيانات.
import testimonialsData from '/src/data/testimonials.json';

/* ------------------------------------------------------------
   0-أ) بناء عنصر تقييم واحد من القالب + عنصر بيانات
   ------------------------------------------------------------ */
function createTestimonialItem(item, template) {
  const fragment = template.content.cloneNode(true);
  const li = fragment.querySelector('.testimonials__item');

  li.dataset.testimonial = String(item.id);
  li.querySelector('.testimonials__quote').textContent = item.quote ?? '';
  li.querySelector('.testimonials__author-name').textContent = item.name ?? '';
  li.querySelector('.testimonials__author-meta').textContent = item.meta ?? '';

  return fragment;
}

/* ------------------------------------------------------------
   0-ب) حقن كل التقييمات داخل #testimonials-row
   ------------------------------------------------------------ */
function renderTestimonials(track, template) {
  const data = testimonialsData?.testimonials ?? [];
  if (data.length === 0) return;

  const rowFragment = document.createDocumentFragment();
  data.forEach((item) => {
    rowFragment.appendChild(createTestimonialItem(item, template));
  });

  track.appendChild(rowFragment);
}

export function initTestimonials() {
  const track = document.getElementById('testimonials-row');
  const template = document.getElementById('testimonial-template');
  const dotsWrap = document.querySelector('.testimonials__dots');

  if (!track || !template || !dotsWrap) return;

  // نحقن التقييمات أولًا، وبعدين نقرأها من الـ DOM عشان نولّد النقاط بنفس العدد
  renderTestimonials(track, template);
  const items = [...track.querySelectorAll('.testimonials__item')];

  if (items.length === 0) return;

  /* ------------------------------------------------------------
     1) توليد النقاط ديناميكيًا بنفس عدد التقييمات الفعلي الموجود
        في الصفحة وقت التشغيل (بيشيل أي نقاط ثابتة كانت في الـ HTML)
     ------------------------------------------------------------ */
  dotsWrap.innerHTML = '';

  const dots = items.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'testimonials__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', 'false');
    dot.setAttribute('aria-label', `عرض تقييم ${index + 1}`);
    dotsWrap.appendChild(dot);
    return dot;
  });

  dots[0]?.classList.add('testimonials__dot--active');
  dots[0]?.setAttribute('aria-selected', 'true');

  // تقييم واحد بس (أو صفر) -> مفيش داعي لنقاط تنقّل خالص
  if (dots.length <= 1) {
    dotsWrap.hidden = true;
    return;
  }

  /* ------------------------------------------------------------
     2) الضغط على نقطة -> سكرول للتقييم المطابق
     ------------------------------------------------------------ */
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      items[index]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });
  });

  /* ------------------------------------------------------------
     3) Scroll Spy — تفعيل النقطة المطابقة للتقييم الأكثر ظهورًا حاليًا
     ------------------------------------------------------------ */
  const setActiveDot = (activeIndex) => {
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('testimonials__dot--active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  };

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      const mostVisibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!mostVisibleEntry) return;

      const activeIndex = items.indexOf(mostVisibleEntry.target);
      if (activeIndex !== -1) setActiveDot(activeIndex);
    },
    {
      root: track,
      threshold: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
    }
  );

  items.forEach((item) => scrollObserver.observe(item));
}