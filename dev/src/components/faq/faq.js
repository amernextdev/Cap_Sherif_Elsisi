/* ================================================================
   Raafat Coaching — faq.js
   منطق فتح/غلق الأسئلة الشائعة (Accordion)

   يعتمد على بنية الـ HTML التالية داخل .faq__list:

   <div class="faq__item">
     <button class="faq__btn" type="button" aria-expanded="false" aria-controls="faq-answer-1">
       <span>[السؤال]</span>
       <span class="faq__btn-icon" aria-hidden="true">...</span>
     </button>
     <div class="faq__answer" id="faq-answer-1" hidden>[الجواب]</div>
   </div>

   ملاحظات مهمة:
   - العناصر بتتحقن ديناميكيًا من data.json عبر main.js، فالسكريبت هنا
     بيستخدم Event Delegation على .faq__list بدل ما يعمل addEventListener
     على كل زرار لوحده. ده معناه إن المنطق هيشتغل صح سواء الأسئلة
     موجودة وقت تحميل السكريبت أو اتحقنت بعد كده.
   - افتراضيًا الوضع Accordion (سؤال واحد مفتوح في نفس الوقت). لو حابب
     تسمح بفتح أكتر من سؤال في نفس الوقت، غيّر ACCORDION_MODE لـ false.
   ================================================================ */

const ACCORDION_MODE = true;

// Vite بيدعم استيراد JSON بشكل مباشر (native ESM JSON import).
// المسار نسبي من مكان هذا الملف لمكان البيانات.
import faqData from "/src/data/faq.json";

/**
 * يبني عنصر سؤال/جواب واحد من القالب + عنصر بيانات، بمعرّف (id) فريد
 * يربط الزرار بإجابته عن طريق aria-controls
 * @param {object} item
 * @param {HTMLTemplateElement} template
 * @param {number} index
 */
function createFaqItem(item, template, index) {
  const fragment = template.content.cloneNode(true);
  const btn = fragment.querySelector(".faq__btn");
  const question = fragment.querySelector(".faq__question-text");
  const answer = fragment.querySelector(".faq__answer");

  const answerId = `faq-answer-${item.id ?? index + 1}`;

  question.textContent = item.question ?? "";
  answer.textContent = item.answer ?? "";
  answer.id = answerId;
  btn.setAttribute("aria-controls", answerId);

  return fragment;
}

/**
 * يحقن كل الأسئلة داخل قائمة .faq__list معينة، مرة واحدة بس
 * (بيتفادى التكرار لو initFaq اتنادى أكتر من مرة)
 * @param {HTMLElement} list
 */
function renderFaqItems(list) {
  if (list.dataset.faqRendered === "true") return;

  const template = document.getElementById("faq-template");
  const items = faqData?.faq ?? [];
  if (!template || items.length === 0) return;

  list.dataset.faqRendered = "true";

  const listFragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    listFragment.appendChild(createFaqItem(item, template, index));
  });

  list.appendChild(listFragment);
}

/**
 * يفتح عنصر سؤال معين
 * @param {HTMLButtonElement} btn
 */
function openItem(btn) {
  const answer = getAnswerEl(btn);
  if (!answer) return;

  btn.setAttribute("aria-expanded", "true");
  answer.hidden = false;
}

/**
 * يغلق عنصر سؤال معين
 * @param {HTMLButtonElement} btn
 */
function closeItem(btn) {
  const answer = getAnswerEl(btn);
  if (!answer) return;

  btn.setAttribute("aria-expanded", "false");
  answer.hidden = true;
}

/**
 * يرجع عنصر الإجابة المرتبط بالزرار عن طريق aria-controls
 * @param {HTMLButtonElement} btn
 * @returns {HTMLElement|null}
 */
function getAnswerEl(btn) {
  const answerId = btn.getAttribute("aria-controls");
  if (!answerId) return null;
  return document.getElementById(answerId);
}

/**
 * يقفل كل الأسئلة المفتوحة داخل نفس القائمة ما عدا الزرار المستثنى
 * @param {HTMLElement} list - عنصر .faq__list
 * @param {HTMLButtonElement} exceptBtn - الزرار اللي متسمحش بغلقه
 */
function closeAllExcept(list, exceptBtn) {
  const openButtons = list.querySelectorAll('.faq__btn[aria-expanded="true"]');
  openButtons.forEach((otherBtn) => {
    if (otherBtn !== exceptBtn) {
      closeItem(otherBtn);
    }
  });
}

/**
 * يعالج الضغط على أي زرار سؤال
 * @param {HTMLButtonElement} btn
 */
function toggleItem(btn) {
  const isExpanded = btn.getAttribute("aria-expanded") === "true";
  const list = btn.closest(".faq__list");

  if (isExpanded) {
    closeItem(btn);
    return;
  }

  if (ACCORDION_MODE && list) {
    closeAllExcept(list, btn);
  }

  openItem(btn);
}

/**
 * تفعيل منطق الـ FAQ على كل قوائم .faq__list الموجودة في الصفحة
 */
export function initFaq() {
  const lists = document.querySelectorAll(".faq__list");
  if (!lists.length) return;

  lists.forEach((list) => {
    renderFaqItems(list);

    // تجنّب ربط نفس القائمة أكتر من مرة لو initFaq اتنادى أكتر من مرة
    if (list.dataset.faqBound === "true") return;
    list.dataset.faqBound = "true";

    list.addEventListener("click", (event) => {
      const btn = event.target.closest(".faq__btn");
      if (!btn || !list.contains(btn)) return;
      toggleItem(btn);
    });
  });
}

// تفعيل تلقائي بمجرد تحميل الـ DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFaq);
} else {
  initFaq();
}

// إتاحة استدعاء يدوي من main.js بعد حقن عناصر الأسئلة من data.json
// مثال: import { initFaq } from './faq.js'; ... initFaq();
export default initFaq;