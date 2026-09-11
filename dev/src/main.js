// ==============
//  CSS
// ==============
import '/src/style.css'

// ==============
// Data JSON
// ==============
import botDataJson from '/src/data/chatbot-data.json';

// ==============
//  Services JS
// ==============

// ==============
// Components JS
// ==============
import { initHeader } from '/src/components/header/header.js';
initHeader();
import { inittransformations } from "/src/components/transformations/transformations.js";
inittransformations();
import { initTestimonials } from "/src/components/testimonials/testimonials.js";
initTestimonials();
import { initPricing } from "/src/components/pricing/pricing.js";
initPricing();
import "/src/components/faq/faq.js";
import { initFloatingActions } from "/src/components/floating-actions/floating-actions.js";
initFloatingActions();
import { MenuBot } from '/src/components/chatbot/chatbot.js';

   
// ==============
// Start
// ==============
let bot;

async function startBot() {
  bot = MenuBot.init({
    containerId: "chatbot-container",
    data: botDataJson,        // استيراد مباشر بدل fetch (أنضف مع Vite)
    mode: "floating"
  });
}

startBot();

document.getElementById("my-custom-open-btn").addEventListener("click", () => {
  if (bot) bot.open();
});