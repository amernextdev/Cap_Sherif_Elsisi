/* ================================================================
   Raafat Coaching — header.js
   منطق الهيدر والقائمة الجانبية (Side Menu)

   المسؤوليات:
   1. فتح/غلق القائمة الجانبية (زر الهيدر، زر الإغلاق، الضغط خارج
      القائمة، والضغط على أي رابط جواها).
   2. تمييز الرابط النشط في القائمة (class="active") حسب القسم
      الظاهر حاليًا في الشاشة — بيشتغل من أول ما الصفحة تتحمل.

   خارج نطاق الملف ده عمدًا:
   - تبديل اللغة (#side-menu-lang-toggle) — هيتعامل معه ملف/منطق منفصل لاحقًا.

   الاستخدام في main.js:
     import { initHeader } from './components/header/header.js';
     initHeader();
   ================================================================ */

export function initHeader() {
  const menuToggle = document.querySelector('.header__menu-toggle');
  const sideMenu = document.getElementById('side-menu');

  if (!menuToggle || !sideMenu) return;

  const closeBtn = sideMenu.querySelector('.side-menu__close-btn');
  const navLinks = [...sideMenu.querySelectorAll('.side-menu__nav-link')];

  /* ------------------------------------------------------------
     1) فتح / غلق القائمة الجانبية
     ------------------------------------------------------------ */
  const openMenu = () => {
    sideMenu.removeAttribute('data-closing'); // تحسّب لحالة فتح سريع أثناء أنيميشن غلق سابق
    sideMenu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    // منع سكرول الخلفية والقائمة مفتوحة (تأثير مؤقت وقت فتحها بس،
    // مش هيأثر على position: sticky للهيدر لأنه أصلاً مغطّى بالأوفرلاي وقتها)
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    // منع الضغط المتكرر أثناء تشغيل أنيميشن الغلق
    if (sideMenu.hasAttribute('data-closing')) return;

    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    sideMenu.setAttribute('data-closing', '');

    // ننتظر انتهاء أنيميشن الغلق الخاص باللوحة الداخلية (slideOutPanel) —
    // هي دايمًا الأطول مدة (بتستخدم --transition-slow)، فانتظارها بيضمن
    // اكتمال حركة الخروج بالكامل حتى لو اتغيّرت مدة الأوفرلاي مستقبلًا
    const innerPanel = sideMenu.querySelector('.side-menu__inner');

    const handleAnimationEnd = (event) => {
      if (event.target !== innerPanel) return;
      sideMenu.hidden = true;
      sideMenu.removeAttribute('data-closing');
      innerPanel.removeEventListener('animationend', handleAnimationEnd);
    };

    innerPanel.addEventListener('animationend', handleAnimationEnd);
  };

  const toggleMenu = () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  };

  menuToggle.addEventListener('click', toggleMenu);
  closeBtn?.addEventListener('click', closeMenu);

  // الغلق عند الضغط على الأوفرلاي نفسه (خارج .side-menu__inner)،
  // مش عند الضغط جوه اللوحة نفسها
  sideMenu.addEventListener('click', (event) => {
    if (event.target === sideMenu) closeMenu();
  });

  // الغلق عند الضغط على أي رابط جوه القائمة (روابط التنقّل + زر الـ CTA)
  sideMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // الغلق بمفتاح Escape — تحسين إضافي لتجربة لوحة المفاتيح
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sideMenu.hidden) closeMenu();
  });

  /* ------------------------------------------------------------
     2) تمييز الرابط النشط حسب القسم الظاهر حاليًا في الشاشة
     ------------------------------------------------------------ */
  const trackedSections = navLinks
    .map((link) => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      const section = targetId ? document.getElementById(targetId) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (trackedSections.length === 0) return;

  const setActiveLink = (activeSection) => {
    trackedSections.forEach(({ link, section }) => {
      link.classList.toggle('active', section === activeSection);
    });
  };

  // "خط التفعيل" وهمي حوالي ثلث الشاشة من فوق — أول قسم يوصل للخط ده
  // هو اللي بيتفعّل. بيشتغل تلقائيًا من أول تحميل الصفحة (IntersectionObserver
  // بيطلق أول نتيجة فورًا لما تعمل observe()، مش لازم انتظار سكرول).
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleEntries.length === 0) return;

      const topMostVisible = visibleEntries[0].target;
      const activeSection = trackedSections.find(
        ({ section }) => section === topMostVisible
      )?.section;

      if (activeSection) setActiveLink(activeSection);
    },
    {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }
  );

  trackedSections.forEach(({ section }) => sectionObserver.observe(section));
}