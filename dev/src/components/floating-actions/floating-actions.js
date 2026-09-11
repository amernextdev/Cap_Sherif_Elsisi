/* ================================================================
   Raafat Coaching — floating-actions.js
   منطق فتح/غلق قائمة الأزرار العائمة (زر + وسط الشاشة) + لوحة
   حسابات التواصل الاجتماعي المنبثقة منها

   ملاحظة: #my-custom-open-btn (فتح الشات بوت) متعمّدًا مش متلموس
   هنا — بيتعامل معه سكربت الشات بوت الخارجي في main.js.

   الاستخدام في main.js:
     import { initFloatingActions } from './components/floating-actions/floating-actions.js';
     initFloatingActions();
   ================================================================ */

export function initFloatingActions() {
  const toggle = document.querySelector('.floating-actions__toggle');
  const menu = document.getElementById('floating-actions-menu');
  const socialToggle = document.querySelector('.floating-actions__item--social');
  const socialPanel = document.getElementById('social-panel');
  const socialCloseBtn = socialPanel?.querySelector('.social-panel__close-btn');

  if (!toggle || !menu) return;

  /* ------------------------------------------------------------
     لوحة حسابات التواصل الاجتماعي — طبقة مستقلة تمامًا عن القائمة
     الرئيسية، ليها زرار غلق خاص بيها وضغط برة خاص بيها
     ------------------------------------------------------------ */
  const openSocialPanel = () => {
    if (!socialPanel) return;
    socialPanel.hidden = false;
    socialPanel.setAttribute('aria-hidden', 'false');
    socialToggle?.setAttribute('aria-expanded', 'true');
  };

  const closeSocialPanel = () => {
    if (!socialPanel) return;
    socialPanel.hidden = true;
    socialPanel.setAttribute('aria-hidden', 'true');
    socialToggle?.setAttribute('aria-expanded', 'false');
  };

  const toggleSocialPanel = () => {
    const isOpen = socialToggle?.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeSocialPanel();
    else openSocialPanel();
  };

  socialToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSocialPanel();
  });

  socialCloseBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    closeSocialPanel();
  });

  /* ------------------------------------------------------------
     قائمة الأزرار العائمة الرئيسية — طبقة مستقلة كمان، غلقها
     مش بيأثر على لوحة السوشيال والعكس صحيح
     ------------------------------------------------------------ */
  const openMenu = () => {
    menu.removeAttribute('data-closing'); // تحسّب لحالة فتح سريع أثناء أنيميشن غلق سابق
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    // منع الضغط المتكرر أثناء تشغيل أنيميشن الغلق
    if (menu.hasAttribute('data-closing')) return;

    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('data-closing', '');

    // ننتظر انتهاء أنيميشن floatDown قبل ما نحط hidden فعليًا — لو
    // حطيناها فورًا، المتصفح هيعمل display:none على طول وهيقطع
    // الأنيميشن قبل ما تلحق تتشغل
    const handleAnimationEnd = (event) => {
      if (event.target !== menu) return;
      menu.hidden = true;
      menu.removeAttribute('data-closing');
      menu.removeEventListener('animationend', handleAnimationEnd);
    };

    menu.addEventListener('animationend', handleAnimationEnd);
  };

  const toggleMenu = () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  /* ------------------------------------------------------------
     الضغط خارج المنطقة كلها — بيقفل "طبقة واحدة بس" في كل ضغطة:
     لو لوحة السوشيال فاتحة (وهي الأعلى بصريًا) بتتقفل هي الأول،
     وبعدين ضغطة تانية برة تقفل القائمة الرئيسية لو لسه فاتحة
     ------------------------------------------------------------ */
  document.addEventListener('click', (event) => {
    const clickedInsideFloatingActions = event.target.closest('.floating-actions');
    const clickedInsideSocialPanel = event.target.closest('#social-panel');

    if (clickedInsideFloatingActions || clickedInsideSocialPanel) return;

    if (socialPanel && !socialPanel.hidden) {
      closeSocialPanel();
      return; // نكتفي بغلق الطبقة العليا بس في الضغطة دي
    }

    if (!menu.hidden) closeMenu();
  });

  // الغلق بمفتاح Escape — بنفس منطق "طبقة واحدة في كل مرة"
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (socialPanel && !socialPanel.hidden) {
      closeSocialPanel();
      return;
    }
    if (!menu.hidden) closeMenu();
  });
}