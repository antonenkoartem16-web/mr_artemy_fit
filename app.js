/* MR. ARTEMY FIT — shared site script (all pages, all languages).
   Each page sets before loading this file:
     window.PAGE_LANG  — 'uk' | 'pl' | 'ru' | 'en'  (null on the root language gateway)
     window.PAGE_SLUG  — '' for home, or 'about' | 'approach' | 'medical-fitness' | 'results' | 'services'
     window.ASSET      — relative prefix to the site root ('', '../', '../../') */
var PAGE_LANG = window.PAGE_LANG || null;
var PAGE_SLUG = window.PAGE_SLUG || '';
var ASSET = window.ASSET || '';
// Contact form goes through a Cloudflare Worker — the Telegram token
// lives there and is never exposed in the browser.
var FORM_ENDPOINT = 'https://wandering-shape-10c0.antonenkoartem16.workers.dev';

// ---- LANG PICKER ----
function pickLang(lang) {
  gotoLang(lang);
}
function openCurtain() {
  if (document.body.classList.contains('intro-done')) return;
  if (!document.getElementById('intro3d')) { document.body.classList.add('intro-done'); return; }
  var alreadyPlayed = false;
  try { alreadyPlayed = sessionStorage.getItem('maf_intro_played') === '1'; } catch(e) {}
  if (alreadyPlayed) {
    document.body.classList.add('intro-done');
    return;
  }
  try { sessionStorage.setItem('maf_intro_played', '1'); } catch(e) {}
  if (window.play3DIntro) { window.play3DIntro(); } else { document.body.classList.add('intro-done'); }
  setTimeout(function(){ document.body.classList.add('intro-done'); }, 6000);
}
document.addEventListener('DOMContentLoaded', function(){
  var ftsEl = document.getElementById('fts');
  if (ftsEl) ftsEl.value = String(Date.now());
});

// ---- COOKIE CONSENT ----
var GA_MEASUREMENT_ID = 'G-E04N72X758';
var META_PIXEL_ID = '3012592245745976';
function trackCTA(loc){ if (window.gtag) { window.gtag('event', 'cta_click', { cta_location: loc }); } }
function loadAnalyticsIfConsented(){
  var consent = localStorage.getItem('cookie_consent');
  if (consent === 'accepted' && !window.gaLoaded) {
    window.gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    // Meta Pixel
    (function(f,b,e,v,n,t,s2){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s2=b.getElementsByTagName(e)[0];s2.parentNode.insertBefore(t,s2)})(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}
function setCookieConsent(accepted){
  localStorage.setItem('cookie_consent', accepted ? 'accepted' : 'rejected');
  var b = document.getElementById('cookieBanner');
  b.classList.remove('visible');
  setTimeout(function(){ b.classList.remove('show'); }, 400);
  if (accepted) loadAnalyticsIfConsented();
}
document.addEventListener('DOMContentLoaded', function(){
  var existing = localStorage.getItem('cookie_consent');
  if (existing === 'accepted') { loadAnalyticsIfConsented(); return; }
  if (existing === 'rejected') return;
  var b = document.getElementById('cookieBanner');
  if (!b) return;
  setTimeout(function(){
    b.classList.add('show');
    requestAnimationFrame(function(){ b.classList.add('visible'); });
  }, 1800);
});

document.addEventListener('DOMContentLoaded', function() {
  var ov = document.getElementById('langOverlay');
  if (PAGE_LANG) {
    if (ov) ov.style.display = 'none';
    setLang(PAGE_LANG);
    try { localStorage.setItem('maf_lang', PAGE_LANG); } catch(e) {}
  } else {
    var saved = null;
    try { saved = localStorage.getItem('maf_lang'); } catch(e) {}
    if (saved) { if (ov) ov.style.display = 'none'; setLang(saved); }
  }
  var skipIntro = false;
  try {
    skipIntro = sessionStorage.getItem('maf_skip_intro') === '1';
    if (skipIntro) sessionStorage.removeItem('maf_skip_intro');
  } catch(e) {}
  if (skipIntro) {
    document.body.classList.add('intro-done');
    var i3d = document.getElementById('intro3d');
    if (i3d) i3d.classList.remove('active');
  } else {
    openCurtain();
  }
});


// ---- CURSOR ----
var cur = document.getElementById('cursor');
var ring = document.getElementById('cursorRing');
var cursorReady = false;
var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, cursorLoopStarted = false;
document.addEventListener('mousemove', function(e) {
  mouseX = e.clientX; mouseY = e.clientY;
  if (!cursorReady) {
    cursorReady = true;
    ringX = mouseX; ringY = mouseY;
    cur.style.display = 'block';
    ring.style.display = 'block';
    document.body.style.cursor = 'none';
    if (!cursorLoopStarted) { cursorLoopStarted = true; requestAnimationFrame(moveCursorRing); }
  }
  cur.style.left = mouseX + 'px';
  cur.style.top = mouseY + 'px';
});
function moveCursorRing() {
  ringX += (mouseX - ringX) * 0.16;
  ringY += (mouseY - ringY) * 0.16;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(moveCursorRing);
}
document.addEventListener('mouseleave', function() {
  cur.style.display = 'none';
  ring.style.display = 'none';
  document.body.style.cursor = 'auto';
  cursorReady = false;
});

// ---- HERO MAGNETIC TILT ----
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  (function(){
    var heroSec = document.getElementById('hero');
    var titleTilt = document.querySelector('.hero-title-tilt');
    if (!heroSec || !titleTilt) return;
    var tiltX = 0, tiltY = 0, tTiltX = 0, tTiltY = 0;
    var looping = false;
    heroSec.addEventListener('mousemove', function(e){
      var r = heroSec.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tTiltY = nx * 3.2;
      tTiltX = -ny * 3.2;
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    });
    heroSec.addEventListener('mouseleave', function(){ tTiltX = 0; tTiltY = 0; });
    function loop(){
      tiltX += (tTiltX - tiltX) * 0.07;
      tiltY += (tTiltY - tiltY) * 0.07;
      titleTilt.style.transform = 'perspective(900px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
      var settled = Math.abs(tTiltX - tiltX) < 0.02 && Math.abs(tTiltY - tiltY) < 0.02;
      if (!settled) { requestAnimationFrame(loop); } else { looping = false; }
    }
  })();
}
document.querySelectorAll('a,button,.sc,.client-card,.t-card,.dk-card,.cond-item').forEach(function(el) {
  el.addEventListener('mouseenter', function() { ring.style.width='54px';ring.style.height='54px';ring.style.borderColor='rgba(201,168,76,0.8)'; });
  el.addEventListener('mouseleave', function() { ring.style.width='36px';ring.style.height='36px';ring.style.borderColor='rgba(201,168,76,0.5)'; });
});
document.querySelectorAll('.sc,.client-card,.cond-item').forEach(function(el) {
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
});

// ---- NAVBAR ----
(function(){
  var navEl = document.getElementById('nav');
  var ticking = false;
  function updateScrollUI(){
    var y = window.scrollY;
    navEl.classList.toggle('scrolled', y > 50);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? (y / max) : 0;
    document.documentElement.style.setProperty('--scroll-progress', progress);
    ticking = false;
  }
  window.addEventListener('scroll', function() {
    if (!ticking) { requestAnimationFrame(updateScrollUI); ticking = true; }
  }, { passive: true });
})();

// ---- COUNTERS ----
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function fmtNum(v){ return v >= 1000 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : String(v); }
function runCounter(el) {
  var t = parseInt(el.getAttribute('data-target'));
  var dur = 1200; var start = null;
  function frame(ts){
    if(start===null) start = ts;
    var p = Math.min((ts - start) / dur, 1);
    var eased = easeOutCubic(p);
    var val = Math.round(eased * t);
    if(val >= t){
      el.textContent = fmtNum(t);
      el.classList.add('counter-done');
      setTimeout(function(){el.classList.remove('counter-done');},700);
      return;
    }
    el.textContent = fmtNum(val);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---- REVEAL ----
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      if (e.target.classList.contains('counter')) runCounter(e.target);
      if (e.target.classList.contains('why-item')) {
        var idx = Array.from(e.target.parentNode.children).indexOf(e.target);
        e.target.style.transitionDelay = (idx * 0.12) + 's';
      }
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.services-grid,.clients-grid,.t-grid,.cond-items,.dk-grid').forEach(function(grid) {
  Array.from(grid.children).forEach(function(el, idx) {
    if (el.classList.contains('reveal')) el.style.transitionDelay = ((idx % 3) * 0.09) + 's';
  });
});
document.querySelectorAll('.reveal,.why-item,.counter').forEach(function(el) { obs.observe(el); });
window.addEventListener('load', function() { setTimeout(function() { document.querySelectorAll('#hero .counter').forEach(runCounter); }, 1200); });

// ---- LANGUAGE ----
var currentLang = PAGE_LANG || 'pl';
var CURRENT_PAGE_LANG = PAGE_LANG;
// ---- LANGUAGE URL NAVIGATION (language subpages) ----
function gotoLang(lang){
  if (lang === CURRENT_PAGE_LANG) return;
  try { sessionStorage.setItem('maf_skip_intro', '1'); } catch(e) {}
  localStorage.setItem('maf_lang', lang);
  window.location.href = '/' + lang + '/' + (PAGE_SLUG ? PAGE_SLUG + '/' : '');
}

// ---- MOBILE MENU ----
function toggleMobileMenu(){
  var menu = document.getElementById('mobileMenu');
  var burger = document.getElementById('navBurger');
  var isOpen = menu.classList.toggle('open');
  burger.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
function closeMobileMenu(){
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('navBurger').classList.remove('open');
  document.body.style.overflow = '';
}

function setLang(lang) {
  currentLang = lang;
  var map = { uk:'UA', en:'EN', ru:'RU', pl:'PL' };
  var titles = {
    uk:'MR. ARTEMY FIT — Персональний тренер · Bielsko-Biała · Онлайн',
    en:'MR. ARTEMY FIT — Personal Trainer · Bielsko-Biała · Online',
    ru:'MR. ARTEMY FIT — Персональный тренер · Bielsko-Biała · Онлайн',
    pl:'MR. ARTEMY FIT — Trener personalny · Bielsko-Biała · Online'
  };
  var ht = document.documentElement.getAttribute('data-title-' + lang);
  document.title = ht || titles[lang] || titles.uk;
  document.querySelectorAll('[data-page]').forEach(function(a) {
    var pg = a.getAttribute('data-page');
    var hash = a.getAttribute('data-hash') || '';
    a.setAttribute('href', '/' + lang + '/' + (pg ? pg + '/' : '') + hash);
  });
  document.querySelectorAll('.case-filter-btn').forEach(function(b){ var v=b.getAttribute('data-'+lang); if(v) b.textContent=v; });
  document.querySelectorAll('.lang-btn').forEach(function(b) { b.classList.toggle('active', b.textContent === map[lang]); });
  document.querySelectorAll('[data-'+lang+']').forEach(function(el) {
    var val = el.getAttribute('data-'+lang);
    if (el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.placeholder = val;
    else if (el.tagName==='OPTION') el.textContent = val;
    else el.innerHTML = val;
  });
  document.querySelectorAll('[data-ph-'+lang+']').forEach(function(el) { el.placeholder = el.getAttribute('data-ph-'+lang); });
  document.documentElement.lang = lang;
  if (typeof setClientsCollapseHeight === 'function') setTimeout(setClientsCollapseHeight, 50);
}

// ---- SERVICE MODAL DATA ----
var services = {
  consult:{
    uk:{title:'КОНСУЛЬТАЦІЯ',price:'100 zł',items:['Відповіді на всі запитання щодо тренувань і харчування','Аналіз вашої ситуації та цілей','Рекомендації щодо тренувань і харчування','Розуміння, як рухатися далі','Формат: онлайн або особисто, до 60 хв'],result:'Ви отримаєте чіткі відповіді і повне розуміння своєї ситуації. Будете знати, як рухатись далі без хаосу та помилок.'},
    en:{title:'CONSULTATION',price:'100 zł',items:['Answers to all training and nutrition questions','Analysis of your situation and goals','Recommendations on training and nutrition','Understanding how to move forward','Format: online or in person, up to 60 min'],result:"You'll get clear answers and a full understanding of your situation. You'll know how to move forward without chaos."},
    ru:{title:'КОНСУЛЬТАЦИЯ',price:'100 zł',items:['Ответы на все вопросы по тренировкам и питанию','Анализ вашей ситуации и целей','Рекомендации по тренировкам и питанию','Понимание, как двигаться дальше','Формат: онлайн или лично, до 60 мин'],result:'Вы получите чёткие ответы и полное понимание своей ситуации. Будете знать, как двигаться дальше без хаоса.'},
    pl:{title:'KONSULTACJA',price:'100 zł',items:['Odpowiedzi na wszystkie pytania dot. treningu i diety','Analiza Twojej sytuacji i celów','Zalecenia dot. treningu i żywienia','Zrozumienie jak się dalej rozwijać','Format: online lub osobiście, do 60 min'],result:'Otrzymasz jasne odpowiedzi i pełne zrozumienie swojej sytuacji. Będziesz wiedział jak działać dalej bez chaosu.'}
  },
  consultfull:{
    uk:{title:'КОНСУЛЬТАЦІЯ PRO',price:'300 zł',pitch:"Довгострокова стратегія тренувань, харчування та відновлення — щоб рухатися далі самостійно.",items:["Повний розбір форми, здоров'я та цілей","Індивідуальний план тренувань на довгострок","Індивідуальний план харчування на довгострок","Рекомендації щодо добавок і відновлення","Підтримка і відповіді на всі питання протягом 2 тижнів після консультації"],result:"Повністю готовий план дій: чітка система тренувань, харчування та розвитку форми на тривалий період."},
    en:{title:'CONSULTATION PRO',price:'300 zł',pitch:"A long-term training, nutrition and recovery strategy — so you can keep moving forward on your own.",items:['Full analysis of form, health and goals','Long-term individual training plan','Long-term individual nutrition plan','Supplement and recovery recommendations','Support and answers to all questions for 2 weeks after the consultation'],result:"A completely ready action plan: clear training, nutrition and fitness development system for the long term."},
    ru:{title:'КОНСУЛЬТАЦИЯ PRO',price:'300 zł',pitch:"Долгосрочная стратегия тренировок, питания и восстановления — чтобы двигаться дальше самостоятельно.",items:['Полный разбор формы, здоровья и целей','Индивидуальный план тренировок на долгосрок','Индивидуальный план питания на долгосрок','Рекомендации по добавкам и восстановлению','Поддержка и ответы на все вопросы в течение 2 недель после консультации'],result:'Полностью готовый план действий: чёткая система тренировок, питания и развития формы на длительный период.'},
    pl:{title:'KONSULTACJA PRO',price:'300 zł',pitch:"Długoterminowa strategia treningu, żywienia i regeneracji — abyś mógł/mogła iść dalej samodzielnie.",items:['Pełna analiza formy, zdrowia i celów','Indywidualny plan treningowy na dłuższy okres','Indywidualny plan żywieniowy na dłuższy okres','Zalecenia dot. suplementów i regeneracji','Wsparcie i odpowiedzi na wszystkie pytania przez 2 tygodnie po konsultacji'],result:'W pełni gotowy plan działania: jasny system treningu, żywienia i rozwoju formy na długi okres.'}
  },
  online:{
    uk:{title:'ОНЛАЙН-СУПРОВІД',price:'550 zł / місяць',items:['Індивідуальний план тренувань','Розбір техніки виконання вправ за відео','Підбір продуктового кошика','Гнучкий формат харчування: розрахунок БЖУ / готовий план харчування / інтуїтивне харчування — обираємо те, що вам комфортно','Рекомендації щодо БАДів','Супровід по фармакології (за потреби)','Я на зв\'язку щодня — оперативні корективи за потреби, основне оновлення плану раз на тиждень'],note:'Чим точніший підхід — тим вищий результат: БЖУ і готовий план працюють передбачуваніше, інтуїтивне харчування простіше, але результат м\'якший. Обираємо те, що ви реально зможете дотримуватися на довгостроку.',result:'Повний контроль над вашим прогресом. Система налаштована індивідуально і регулярно коригується для максимального ефекту.'},
    en:{title:'ONLINE COACHING',price:'550 zł / month',items:['Individual training plan','Exercise technique review via video','Food basket selection','Flexible nutrition format: macro tracking / ready meal plan / intuitive eating — whichever suits you','Supplement recommendations','Pharmacology support if needed',"I'm in touch every day — quick adjustments when needed, main plan update once a week"],note:'The more precise the approach, the better the result: macro tracking and a ready meal plan are more predictable, intuitive eating is simpler but gives softer results. We pick what you can actually stick to long-term.',result:'Full professional control over your progress. The system is individually tuned and regularly adjusted for maximum effect.'},
    ru:{title:'ОНЛАЙН-СОПРОВОЖДЕНИЕ',price:'550 zł / месяц',items:['Индивидуальный план тренировок','Разбор техники выполнения упражнений по видео','Подбор продуктовой корзины','Гибкий формат питания: расчёт БЖУ / готовый план питания / интуитивное питание — выбираем то, что вам комфортно','Рекомендации по БАДам','Сопровождение по фармакологии (при необходимости)','Я на связи каждый день — оперативные корректировки по мере необходимости, основное обновление плана раз в неделю'],note:'Чем точнее подход — тем выше результат: БЖУ и готовый план работают предсказуемее, интуитивное питание проще, но результат мягче. Выбираем то, что вы реально сможете придерживаться в долгосроке.',result:'Полный контроль над вашим прогрессом. Система настроена индивидуально и регулярно корректируется для максимального эффекта.'},
    pl:{title:'OPIEKA ONLINE',price:'550 zł / miesiąc',items:['Indywidualny plan treningowy','Korekta techniki ćwiczeń na podstawie wideo','Dobór koszyka produktów','Elastyczny format żywienia: liczenie makroskładników / gotowy plan żywieniowy / jedzenie intuicyjne — wybieramy to, co Ci wygodne','Zalecenia dot. suplementów (BADy)','Wsparcie farmakologiczne w razie potrzeby','Jestem w kontakcie codziennie — szybkie korekty w razie potrzeby, główna aktualizacja planu raz w tygodniu'],note:'Im dokładniejsze podejście, tym lepszy efekt: liczenie makroskładników i gotowy plan działają bardziej przewidywalnie, jedzenie intuicyjne jest prostsze, ale efekt jest łagodniejszy. Wybieramy to, czego realnie będziesz w stanie się trzymać długoterminowo.',result:'Pełna kontrola nad Twoim postępem. System indywidualnie dostosowany i regularnie korygowany dla maksymalnego efektu.'}
  },
  personal:{
    uk:{title:'ПЕРСОНАЛЬНІ ТРЕНУВАННЯ',price:'130 zł / 1 тр · 600 zł / 5 тр · 1100 zł / 10 тр',items:['Індивідуальна робота в залі (CityFit · FC24, Bielsko-Biała)','Постановка техніки виконання вправ','Персональна програма тренувань','Повний супровід між тренуваннями','Повний контроль харчування','Супровід по добавках і фармакології (за потреби)','Постійний зв\'язок і корекції'],medNoteTitle:'Медичний тренінг',medNoteText:'Працюю з людьми, які мають серйозні проблеми зі здоров\'ям — травми, хронічні стани, обмеження після операцій. Фінальну вартість визначаю індивідуально після консультації, залежно від складності випадку.',medNoteCap:'Вартість ніколи не перевищує базову ціну більш ніж на 20 zł за тренування.',medNoteMax:'Максимум: 150 zł / 1 тр · 700 zł / 5 тр · 1300 zł / 10 тр',medNoteFlag:'Важливо',result:'Максимально швидкий і якісний результат через особисту роботу. Все те ж саме, що в онлайн-веденні, але з живим контролем і швидшими корекціями.'},
    en:{title:'PERSONAL TRAINING',price:'130 zł / 1 ses · 600 zł / 5 ses · 1100 zł / 10 ses',items:['Individual work in the gym (CityFit · FC24, Bielsko-Biała)','Technique correction','Personal training program','Full support between sessions','Full nutrition control','Supplement & pharmacology support if needed','Constant communication and adjustments'],medNoteTitle:'Medical training',medNoteText:"For people with serious health conditions — injuries, chronic issues, post-surgery limitations. The final price is set individually after a consultation, based on case complexity.",medNoteCap:'The price never exceeds the base rate by more than 20 zł per session.',medNoteMax:'Maximum: 150 zł / 1 ses · 700 zł / 5 ses · 1300 zł / 10 ses',medNoteFlag:'Important',result:'Maximum fast and quality results through personal work. Everything from online coaching but with live control and faster adjustments.'},
    ru:{title:'ПЕРСОНАЛЬНЫЕ ТРЕНИРОВКИ',price:'130 zł / 1 тр · 600 zł / 5 тр · 1100 zł / 10 тр',items:['Индивидуальная работа в зале (CityFit · FC24, Bielsko-Biała)','Постановка техники выполнения упражнений','Персональная программа тренировок','Полное сопровождение между тренировками','Полный контроль питания','Сопровождение по добавкам и фармакологии (при необходимости)','Постоянная связь и коррекции'],medNoteTitle:'Медицинский тренинг',medNoteText:'Работаю с людьми, у которых есть серьёзные проблемы со здоровьем — травмы, хронические состояния, ограничения после операций. Итоговую стоимость определяю индивидуально после консультации, в зависимости от сложности случая.',medNoteCap:'Стоимость никогда не превышает базовую цену больше чем на 20 zł за тренировку.',medNoteMax:'Максимум: 150 zł / 1 тр · 700 zł / 5 тр · 1300 zł / 10 тр',medNoteFlag:'Важно',result:'Максимально быстрый и качественный результат через личную работу. Всё то же самое, что в онлайн-ведении, но с живым контролем и более быстрыми коррекциями.'},
    pl:{title:'TRENING PERSONALNY',price:'130 zł / 1 tr · 600 zł / 5 tr · 1100 zł / 10 tr',items:['Indywidualna praca na siłowni (CityFit · FC24, Bielsko-Biała)','Korekta techniki ćwiczeń','Personalny program treningowy','Pełne wsparcie między sesjami','Pełna kontrola żywienia','Wsparcie suplementacyjne i farmakologiczne w razie potrzeby','Stały kontakt i korekty'],medNoteTitle:'Trening medyczny',medNoteText:'Pracuję z osobami z poważnymi problemami zdrowotnymi — kontuzje, stany przewlekłe, ograniczenia po operacjach. Ostateczną cenę ustalam indywidualnie po konsultacji, w zależności od złożoności przypadku.',medNoteCap:'Cena nigdy nie przekracza stawki bazowej o więcej niż 20 zł za trening.',medNoteMax:'Maksymalnie: 150 zł / 1 tr · 700 zł / 5 tr · 1300 zł / 10 tr',medNoteFlag:'Ważne',result:'Maksymalnie szybkie i jakościowe wyniki przez osobistą pracę. Wszystko co w opiece online, ale z żywą kontrolą i szybszymi korektami.'}
  },
  hybrid:{
    uk:{title:'ГІБРИД (ЗАЛ + СУПРОВІД)',price:'200 zł / місяць + 120 zł / тренування',items:['Індивідуальний онлайн-план тренувань і харчування','Постійний зв\'язок і корекції протягом місяця','Мінімум 2 персональні тренування на місяць у залі — живий контроль техніки','Поєднання переваг онлайн-супроводу та особистого контролю тренера'],result:'Поєднання персональних тренувань і онлайн-супроводу. Я веду вас онлайн, але мінімум 2 рази на місяць треную особисто — щоб наживо контролювати техніку і вносити швидші корективи.'},
    en:{title:'HYBRID (GYM + SUPPORT)',price:'200 zł / month + 120 zł / session',items:['Individual online training and nutrition plan','Constant communication and adjustments throughout the month','Minimum 2 personal sessions per month in the gym — live technique control','Combines the benefits of online coaching with in-person coach control'],result:'A combination of personal training and online coaching. I coach you online, but train you in person at least twice a month to check your technique live and make faster adjustments.'},
    ru:{title:'ГИБРИД (ЗАЛ + СОПРОВОЖДЕНИЕ)',price:'200 zł / месяц + 120 zł / тренировка',items:['Индивидуальный онлайн-план тренировок и питания','Постоянная связь и коррекции в течение месяца','Минимум 2 персональные тренировки в месяц в зале — живой контроль техники','Совмещение преимуществ онлайн-сопровождения и личного контроля тренера'],result:'Совмещение персональных тренировок и онлайн-сопровождения. Веду вас онлайн, но минимум 2 раза в месяц тренирую лично — чтобы вживую контролировать технику и вносить более быстрые коррективы.'},
    pl:{title:'HYBRYDA (SIŁOWNIA + OPIEKA)',price:'200 zł / miesiąc + 120 zł / trening',items:['Indywidualny plan treningowy i żywieniowy online','Stały kontakt i korekty przez cały miesiąc','Minimum 2 treningi personalne miesięcznie na siłowni — żywa kontrola techniki','Połączenie zalet opieki online z osobistą kontrolą trenera'],result:'Połączenie treningu personalnego i opieki online. Prowadzę Cię online, ale minimum 2 razy w miesiącu trenuję Cię osobiście — by na żywo skontrolować technikę i szybciej wprowadzać korekty.'}
  },
  pharma:{
    uk:{title:'ОНЛАЙН-ВЕДЕННЯ ПО ФАРМАКОЛОГІЇ',price:'200 zł / місяць',items:['Підбір курсу під ціль','Схема прийому','Рекомендації щодо аналізів','Контроль аналізів і стану','Корекції по ходу курсу'],result:"Грамотний і безпечний підхід до фармакології під повним контролем. Усі рішення приймаються з урахуванням здоров'я, аналізів і довгострокового результату."},
    en:{title:'ONLINE PHARMACOLOGY COACHING',price:'200 zł / month',items:['Course selection for your goal','Intake schedule','Analysis recommendations','Analysis and condition monitoring','Course adjustments'],result:"A competent and safe approach to pharmacology under full control. All decisions consider health, analysis results and long-term outcomes."},
    ru:{title:'ОНЛАЙН-ВЕДЕНИЕ ПО ФАРМАКОЛОГИИ',price:'200 zł / месяц',items:['Подбор курса под цель','Схема приёма','Рекомендации по анализам','Контроль анализов и состояния','Коррекции по ходу курса'],result:'Грамотный и безопасный подход к фармакологии под полным контролем. Все решения принимаются с учётом здоровья, анализов и долгосрочного результата.'},
    pl:{title:'OPIEKA FARMAKOLOGICZNA ONLINE',price:'200 zł / miesiąc',items:['Dobór kursu pod cel','Schemat przyjmowania','Zalecenia dotyczące badań','Kontrola badań i stanu','Korekty w trakcie kursu'],result:'Kompetentne i bezpieczne podejście do farmakologii pod pełną kontrolą. Wszystkie decyzje uwzględniają zdrowie, wyniki badań i długoterminowe efekty.'}
  }
};

var ctaLabels = {uk:'ЗАПИСАТИСЯ',en:'BOOK NOW',ru:'ЗАПИСАТЬСЯ',pl:'ZAPISZ SIĘ'};
var resultLabels = {uk:'Що це тобі дасть:',en:'What this gives you:',ru:'Что это тебе даст:',pl:'Co to Ci da:'};

// ---- CURRENCY CONVERSION (fixed prices per service) ----
var CUR_SYMBOLS = {pln:'zł', uah:'грн', usd:'$', eur:'€'};
var CUR_LABELS = {pln:'PLN', uah:'UAH', usd:'USD', eur:'EUR'};
var CUR_DISCLAIMER = {
  uk:'Ціна фіксується в злотих. Оплата можлива в zł, грн, $ або € за поточним курсом — будь-яким зручним способом.',
  en:'The price is fixed in PLN. Payment is possible in zł, UAH, $ or € at the current rate — any convenient way.',
  ru:'Цена фиксируется в злотых. Оплата возможна в zł, грн, $ или € по актуальному курсу — любым удобным способом.',
  pl:'Cena jest ustalana w złotych. Płatność możliwa w zł, hrywnach, $ lub € według aktualnego kursu — dowolnym wygodnym sposobem.'
};
var periodWord = {uk:'міс',en:'mo',ru:'мес',pl:'mies'};
var CURRENCY_META = {
  consult:{pln:100, uah:1200, usd:26, eur:23, period:false},
  consultfull:{pln:300, uah:3500, usd:80, eur:70, period:false},
  online:{pln:550, uah:6700, usd:150, eur:130, period:true},
  pharma:{pln:200, uah:2400, usd:50, eur:45, period:true}
};
var currentModalType = null;
var currentCurrency = 'pln';
function formatPrice(meta, cur){
  return meta[cur] + ' ' + CUR_SYMBOLS[cur];
}
function renderModalPrice(){
  var meta = CURRENCY_META[currentModalType];
  if (!meta) return;
  var txt = formatPrice(meta, currentCurrency);
  if (meta.period) txt += ' / ' + (periodWord[currentLang] || 'mo');
  var priceEl = document.getElementById('modalPrice');
  if (priceEl) priceEl.textContent = txt;
  document.querySelectorAll('.cur-pill').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-cur') === currentCurrency); });
}
function setModalCurrency(cur){
  currentCurrency = cur;
  renderModalPrice();
}

function openModal(type) {
  currentModalType = type;
  currentCurrency = 'pln';
  var d = services[type][currentLang];
  var li = d.items.map(function(i){return '<li>'+i+'</li>';}).join('');
  var noteHtml = d.medNoteTitle ? (
    '<div class="modal-note">'+
      '<div class="modal-note-head"><span class="modal-note-icon">✚</span><span>'+d.medNoteTitle+'</span></div>'+
      '<p class="modal-note-text">'+d.medNoteText+'</p>'+
      '<div class="modal-note-foot"><span>'+d.medNoteCap+'</span><div class="modal-note-max"><span class="modal-note-flag">'+d.medNoteFlag+'</span><strong>'+d.medNoteMax+'</strong></div></div>'+
    '</div>'
  ) : '';
  var pitchHtml = d.pitch ? '<p class="modal-pitch">'+d.pitch+'</p>' : '';
  var footnoteHtml = d.note ? '<p class="modal-footnote">'+d.note+'</p>' : '';
  var meta = CURRENCY_META[type];
  var priceHtml;
  if (meta) {
    var pills = Object.keys(CUR_SYMBOLS).map(function(cur){
      return '<button type="button" class="cur-pill'+(cur==='pln'?' active':'')+'" data-cur="'+cur+'" onclick="setModalCurrency(\''+cur+'\')" title="'+CUR_LABELS[cur]+'">'+CUR_SYMBOLS[cur]+'</button>';
    }).join('');
    priceHtml = '<div class="modal-price-row"><div class="modal-price" id="modalPrice">'+d.price+'</div><div class="cur-toggle">'+pills+'</div></div>'+
      '<p class="cur-disclaimer">'+CUR_DISCLAIMER[currentLang]+'</p>';
  } else {
    priceHtml = '<div class="modal-price">'+d.price+'</div>';
  }
  document.getElementById('modal-body').innerHTML =
    '<div class="modal-title">'+d.title+'</div>'+
    priceHtml+
    pitchHtml+
    '<ul class="modal-list">'+li+'</ul>'+
    footnoteHtml+
    noteHtml+
    '<div class="modal-result"><strong>'+resultLabels[currentLang]+'</strong><br>'+d.result+'</div>';
  document.getElementById('modal-cta-btn').textContent = ctaLabels[currentLang];
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
  if (meta) renderModalPrice();
}
function closeModal() { document.getElementById('modal').classList.remove('open'); document.body.style.overflow=''; }
function overlayClick(e) { if(e.target===document.getElementById('modal')) closeModal(); }

// ---- CLIENT CASES ----
var cases = {
  gaurav:{
    img:ASSET+'case-gaurav.webp',
    reviewImg:ASSET+'review-gaurav.webp',
    uk:{title:'+10 КГ ЯКІСНОЇ МАСИ ЗА 6 МІСЯЦІВ',meta:'Gaurav · Без підрахунку калорій · Вегетаріанський раціон',reviewLabel:'Оригінальний відгук клієнта',text:"<h4>З чим прийшов</h4><p>Gaurav повернувся в зал після довгої перерви. Досвід тренувань уже був, але нормального результату раніше досягти так і не вдалося.</p><ul><li>міжхребцева грижа в попереку — сильний біль, іноді важко було навіть рухатись;</li><li>спина боліла практично постійно;</li><li>шлунок вередливий, багато спортивного харчування просто не заходило;</li><li>вегетаріанець, без м'яса та яєць.</li></ul><p>Хотів одного — набрати м'язову масу, зміцнити спину і перестати відчувати її щодня.</p><h4>Що робили</h4><p>Зібрали програму з трьох тренувань на тиждень і підлаштували навантаження так, щоб спина встигала відновлюватись, а прогрес усе одно йшов. З харчуванням не стали рахувати калорії — просто розібрали, що і скільки їсти, щоб було зрозуміло і без напруги.</p><p>Підібрали добавки, які він нормально переносив, щоб закривати білок і енергію. Плюс додали вправи на кор і стабілізацію попереку.</p><h4>Через 6 місяців</h4><ul><li>+10 кг маси, і жир майже не підріс;</li><li>тіло загалом стало відчутно міцнішим;</li><li>болі в спині практично зникли;</li><li>спина більше не заважає ні в житті, ні на тренуваннях;</li><li>з'явились звички, які тримаються самі по собі — і в харчуванні, і в русі.</li></ul><p class=\"case-note\">Ми вже понад півтора року працюємо разом. Коли основну мету закрили, перейшли в режим підтримання форми і гарного самопочуття.</p>"},
    en:{title:'+10 KG OF QUALITY MASS IN 6 MONTHS',meta:'Gaurav · No calorie counting · Vegetarian diet',reviewLabel:'Original client review',text:"<h4>Where he started</h4><p>Gaurav came back to the gym after a long break. He'd trained before, but had never actually managed to get a real result.</p><ul><li>a lumbar disc hernia — serious pain, sometimes hard to even move;</li><li>his back ached pretty much all the time;</li><li>a sensitive stomach that couldn't handle most sports nutrition;</li><li>vegetarian, no meat or eggs.</li></ul><p>He wanted one thing — gain muscle, strengthen his back, and stop feeling it every single day.</p><h4>What we did</h4><p>We built a program around three sessions a week and paced the load so his back could actually recover while he still kept progressing. For nutrition, we skipped calorie counting — just worked out what and how much to eat, in a way that made sense and didn't feel like a chore.</p><p>We picked supplements he tolerated well to cover protein and energy, and added core and lower-back stability work.</p><h4>6 months later</h4><ul><li>+10 kg of mass, with barely any fat gained;</li><li>his whole body feels noticeably stronger;</li><li>the back pain is basically gone;</li><li>his back no longer holds him back — in life or in the gym;</li><li>solid habits that stick on their own, in both training and eating.</li></ul><p class=\"case-note\">We've now been working together for over a year and a half. Once the main goal was reached, we shifted into maintaining his shape and feeling good.</p>"},
    ru:{title:'+10 КГ КАЧЕСТВЕННОЙ МАССЫ ЗА 6 МЕСЯЦЕВ',meta:'Gaurav · Без подсчёта калорий · Вегетарианский рацион',reviewLabel:'Оригинальный отзыв клиента',text:'<h4>С чем пришёл</h4><p>Гаурав вернулся в зал после долгого перерыва. Опыт тренировок у него уже был, но раньше нормального результата добиться так и не получилось.</p><ul><li>межпозвоночная грыжа в пояснице — сильные боли, иногда трудно было даже двигаться;</li><li>спина в целом побаливала постоянно;</li><li>желудок капризный, многое спортивное питание просто не заходило;</li><li>вегетарианец, без мяса и яиц.</li></ul><p>Хотел одного — набрать мышечную массу, укрепить спину и перестать её чувствовать каждый день.</p><h4>Что делали</h4><p>Собрали программу из трёх тренировок в неделю и подстроили нагрузку так, чтобы спина успевала восстанавливаться, а прогресс всё равно шёл. С питанием не стали считать калории — просто разобрали, что и сколько есть, чтобы было понятно и без напряга.</p><p>Подобрали добавки, которые он нормально переносил, чтобы закрывать белок и энергию. Плюс добавили упражнения на кор и стабилизацию поясницы.</p><h4>Через 6 месяцев</h4><ul><li>+10 кг массы, и жир почти не подрос;</li><li>тело в целом стало ощутимо крепче;</li><li>боли в спине практически ушли;</li><li>спина больше не мешает ни в жизни, ни на тренировках;</li><li>появились привычки, которые держатся сами по себе — и в питании, и в движении.</li></ul><p class="case-note">Мы уже больше полутора лет работаем вместе. Когда основная цель была закрыта, перешли в режим поддержания формы и хорошего самочувствия.</p>'},
    pl:{title:'+10 KG DOBREJ JAKOŚCI MASY W 6 MIESIĘCY',meta:'Gaurav · Bez liczenia kalorii · Dieta wegetariańska',reviewLabel:'Oryginalna opinia klienta',text:"<h4>Z czym przyszedł</h4><p>Gaurav wrócił na siłownię po długiej przerwie. Miał już doświadczenie treningowe, ale nigdy wcześniej nie udało mu się osiągnąć realnego efektu.</p><ul><li>przepuklina krążka w odcinku lędźwiowym — silny ból, czasem trudno było się nawet ruszyć;</li><li>plecy bolały właściwie non stop;</li><li>wrażliwy żołądek, większość odżywek sportowych po prostu mu nie służyła;</li><li>wegetarianin, bez mięsa i jajek.</li></ul><p>Chciał jednego — zbudować masę mięśniową, wzmocnić plecy i przestać je czuć każdego dnia.</p><h4>Co zrobiliśmy</h4><p>Ułożyliśmy program z trzech treningów w tygodniu i dobraliśmy obciążenie tak, żeby plecy zdążyły się regenerować, a postępy mimo to szły do przodu. Przy żywieniu nie liczyliśmy kalorii — po prostu ustaliliśmy co i ile jeść, żeby było to zrozumiałe i bez zbędnego stresu.</p><p>Dobraliśmy suplementy, które dobrze tolerował, żeby domknąć białko i energię. Dodaliśmy też ćwiczenia na core i stabilizację odcinka lędźwiowego.</p><h4>Po 6 miesiącach</h4><ul><li>+10 kg masy, praktycznie bez przyrostu tkanki tłuszczowej;</li><li>całe ciało jest wyraźnie mocniejsze;</li><li>ból pleców praktycznie zniknął;</li><li>plecy przestały mu przeszkadzać — zarówno na co dzień, jak i na treningu;</li><li>wypracowały się nawyki, które trzymają się same — zarówno w jedzeniu, jak i w ruchu.</li></ul><p class=\"case-note\">Współpracujemy już ponad półtora roku. Kiedy główny cel został osiągnięty, przeszliśmy w tryb utrzymania formy i dobrego samopoczucia.</p>"}
  },
  nikita:{
    img:ASSET+'case-nikita.webp',
    reviewImg:null,
    uk:{title:'+10 КГ М\'ЯЗІВ ПРИ СЕРЙОЗНИХ ОБМЕЖЕННЯХ ПО ЗОРУ',meta:'Nikita · Без підрахунку калорій · Обмеження по зору',reviewLabel:'',text:"<h4>З чим прийшов</h4><p>Nikita прийшов практично без досвіду силових тренувань. Робота сидяча — спина боліла регулярно, а зір мінус 10 з гаком вимагав особливого підходу до всього процесу.</p><h4>Що робили</h4><ul><li>Склали програму з урахуванням зору — це було перше, від чого відштовхувались.</li><li>Основний акцент — техніка, темп і якість кожного повторення, навантаження додавали обережно.</li><li>Щоб не ризикувати зором, тренувались трохи далі від відмови, але з більшим об'ємом.</li><li>Харчування — без підрахунку калорій.</li></ul><h4>Результат</h4><ul><li>Понад 10 кг м'язів.</li><li>Болі в спині зникли повністю.</li><li>Тіло помітно змінилося.</li><li>І все це — без жодного моменту, коли зір опинявся під загрозою.</li></ul><p class=\"case-note\">Незважаючи на серйозні обмеження по зору, вдалося безпечно набрати понад 10 кг м'язової маси, забути про болі в спині і побудувати сильну, атлетичну форму.</p>"},
    en:{title:'+10 KG OF MUSCLE DESPITE SERIOUS VISION RESTRICTIONS',meta:'Nikita · No calorie counting · Vision restrictions',reviewLabel:'',text:"<h4>Where he started</h4><p>Nikita came in with basically zero strength training experience. Desk job, back hurting regularly, and vision worse than -10 diopters meant the whole process needed a different approach.</p><h4>What we did</h4><ul><li>Built the program around his vision first — that was the starting point for everything else.</li><li>Focused mainly on technique, tempo and quality of every rep, adding load carefully.</li><li>To keep his eyes safe, we trained a bit further from failure but with more volume.</li><li>Nutrition — no calorie counting.</li></ul><h4>Result</h4><ul><li>Over 10 kg of muscle.</li><li>Back pain — completely gone.</li><li>His body changed noticeably.</li><li>And through all of it, not a single moment where his vision was at risk.</li></ul><p class=\"case-note\">Despite serious vision restrictions, he safely gained over 10 kg of muscle, got rid of his back pain, and built a strong, athletic physique.</p>"},
    ru:{title:'+10 КГ МЫШЦ ПРИ СЕРЬЁЗНЫХ ОГРАНИЧЕНИЯХ ПО ЗРЕНИЮ',meta:'Nikita · Без подсчёта калорий · Ограничения по зрению',reviewLabel:'',text:'<h4>С чем пришёл</h4><p>Никита пришёл фактически без опыта силовых тренировок. Работа сидячая — спина болела регулярно, а зрение минус 10 с лишним требовало особого подхода ко всему процессу.</p><h4>Что делали</h4><ul><li>Составили программу с учётом зрения — это было первое, от чего отталкивались.</li><li>Упор сделали на технику, темп и качество каждого повторения, нагрузку добавляли аккуратно.</li><li>Чтобы не рисковать зрением, тренировались чуть дальше от отказа, но с бо́льшим объёмом.</li><li>Питание — без подсчёта калорий.</li></ul><h4>Результат</h4><ul><li>Больше 10 кг мышц.</li><li>Боли в спине ушли полностью.</li><li>Тело заметно изменилось.</li><li>И всё это — без единого момента, когда зрение оказалось бы под угрозой.</li></ul><p class="case-note">Несмотря на серьёзные ограничения по зрению, получилось безопасно набрать больше 10 кг мышц, забыть про боли в спине и построить сильную, атлетичную форму.</p>'},
    pl:{title:'+10 KG MIĘŚNI MIMO POWAŻNYCH OGRANICZEŃ WZROKU',meta:'Nikita · Bez liczenia kalorii · Ograniczenia wzroku',reviewLabel:'',text:"<h4>Z czym przyszedł</h4><p>Nikita przyszedł praktycznie bez doświadczenia w treningu siłowym. Praca siedząca, plecy bolały regularnie, a wzrok gorszy niż -10 dioptrii wymagał zupełnie innego podejścia do całego procesu.</p><h4>Co zrobiliśmy</h4><ul><li>Program ułożyliśmy najpierw pod kątem wzroku — to był punkt wyjścia dla wszystkiego innego.</li><li>Główny nacisk na technikę, tempo i jakość każdego powtórzenia, obciążenie dodawaliśmy ostrożnie.</li><li>Żeby nie ryzykować wzroku, trenowaliśmy trochę dalej od upadku mięśniowego, ale z większą objętością.</li><li>Żywienie — bez liczenia kalorii.</li></ul><h4>Rezultat</h4><ul><li>Ponad 10 kg mięśni.</li><li>Ból pleców zniknął całkowicie.</li><li>Ciało wyraźnie się zmieniło.</li><li>I to wszystko bez ani jednego momentu, w którym wzrok byłby zagrożony.</li></ul><p class=\"case-note\">Mimo poważnych ograniczeń wzroku udało się bezpiecznie zbudować ponad 10 kg masy mięśniowej, pozbyć się bólu pleców i wypracować silną, atletyczną sylwetkę.</p>"}
  },
  david:{
    img:ASSET+'case-david.webp',
    reviewImg:null,
    uk:{title:'ВІД ВИСОКОГО ВІДСОТКА ЖИРУ ДО СПОРТИВНОЇ ФОРМИ ЗА 8 МІСЯЦІВ',meta:'David · Дефіцит калорій · Збереження м\'язової маси',reviewLabel:'',text:'<h4>Вихідна ситуація</h4><p>David прийшов із метою знизити відсоток жиру, покращити композицію тіла та набрати якісну м\'язову масу.</p><p>До початку спільної роботи він вже мав досвід тренувань у залі, однак після перерви повернувся до занять і вирішив підійти до процесу більш системно. Незважаючи на власні знання у сфері фітнесу та навчання у тренерській академії, він захотів довірити побудову стратегії підготовки фахівцю зі сторони.</p><p>На старті у нього був підвищений відсоток жиру та недостатній об\'єм м\'язової маси для бажаної фізичної форми.</p><h4>Мета</h4><ul><li>Знизити відсоток жиру.</li><li>Зробити тіло більш рельєфним і спортивним.</li><li>Зберегти та збільшити м\'язову масу під час сушіння.</li><li>Побудувати ефективну систему харчування та тренувань.</li></ul><h4>Що було зроблено</h4><p>Для досягнення результату була розроблена комплексна стратегія, що включає тренування, харчування та контроль щоденної активності.</p><p>Основним завданням було створити стійкий дефіцит калорій без надмірних обмежень, зберегти продуктивність на тренуваннях і забезпечити максимальне збереження м\'язової маси протягом усього періоду підготовки.</p><p>У процесі роботи програма регулярно коригувалася залежно від прогресу та поточного стану.</p><h4>Результат за 8 місяців</h4><ul><li>Значне зниження відсотка жиру.</li><li>Виражене покращення рельєфу та якості тіла.</li><li>Збереження та розвиток м\'язової маси в процесі сушіння.</li><li>Формування спортивної та естетичної фізичної форми.</li><li>Покращення загального рівня фізичної підготовки та самопочуття.</li></ul><p class="case-note">За 8 місяців вдалося повністю змінити зовнішній вигляд і композицію тіла David. Замість форми з підвищеним відсотком жиру було створено суху, спортивну та візуально атлетичну фізичну форму.</p>'},
    en:{title:'FROM HIGH BODY FAT TO ATHLETIC PHYSIQUE IN 8 MONTHS',meta:'David · Calorie deficit · Muscle retention',reviewLabel:'',text:'<h4>Starting point</h4><p>David came with the goal of reducing body fat, improving body composition, and gaining quality muscle mass.</p><p>He already had gym experience before we started working together, but after a break he returned to training and decided to approach the process more systematically. Despite his own knowledge in fitness and studies at a coaching academy, he wanted to entrust the preparation strategy to an outside specialist.</p><p>At the start he had an elevated body fat percentage and insufficient muscle mass for the physique he was aiming for.</p><h4>Goal</h4><ul><li>Reduce body fat percentage.</li><li>Make the body leaner and more athletic.</li><li>Preserve and increase muscle mass during the cut.</li><li>Build an effective nutrition and training system.</li></ul><h4>What was done</h4><p>A comprehensive strategy was developed covering training, nutrition, and daily activity management.</p><p>The main objective was to create a sustainable calorie deficit without excessive restriction, maintain training performance, and ensure maximum muscle retention throughout the preparation period.</p><p>The program was regularly adjusted based on progress and current condition.</p><h4>Result after 8 months</h4><ul><li>Significant reduction in body fat percentage.</li><li>Pronounced improvement in muscle definition and body quality.</li><li>Muscle mass preserved and developed during the cut.</li><li>Athletic and aesthetic physique achieved.</li><li>Overall fitness level and wellbeing improved.</li></ul><p class="case-note">In 8 months, David\'s appearance and body composition were completely transformed — from a physique with elevated body fat to a lean, athletic, and visually impressive form.</p>'},
    ru:{title:'ОТ ВЫСОКОГО ПРОЦЕНТА ЖИРА К СПОРТИВНОЙ ФОРМЕ ЗА 8 МЕСЯЦЕВ',meta:'David · Дефицит калорий · Сохранение мышечной массы',reviewLabel:'',text:'<h4>Исходная ситуация</h4><p>David пришёл с целью снизить процент жира, улучшить композицию тела и набрать качественную мышечную массу.</p><p>До начала совместной работы он уже имел опыт тренировок в зале, однако после перерыва вернулся к занятиям и решил подойти к процессу более системно. Несмотря на собственные знания в области фитнеса и обучение в тренерской академии, он захотел доверить построение стратегии подготовки специалисту со стороны.</p><p>На старте у него был повышенный процент жира и недостаточный объём мышечной массы для желаемой физической формы.</p><h4>Цель</h4><ul><li>Снизить процент жира.</li><li>Сделать тело более рельефным и спортивным.</li><li>Сохранить и увеличить мышечную массу во время сушки.</li><li>Построить эффективную систему питания и тренировок.</li></ul><h4>Что было сделано</h4><p>Для достижения результата была разработана комплексная стратегия, включающая тренировки, питание и контроль ежедневной активности.</p><p>Основной задачей было создать устойчивый дефицит калорий без чрезмерных ограничений, сохранить производительность на тренировках и обеспечить максимальное сохранение мышечной массы на протяжении всего периода подготовки.</p><p>В процессе работы программа регулярно корректировалась в зависимости от прогресса и текущего состояния.</p><h4>Результат за 8 месяцев</h4><ul><li>Значительное снижение процента жира.</li><li>Выраженное улучшение рельефа и качества тела.</li><li>Сохранение и развитие мышечной массы в процессе сушки.</li><li>Формирование спортивной и эстетичной физической формы.</li><li>Улучшение общего уровня физической подготовки и самочувствия.</li></ul><p class="case-note">За 8 месяцев удалось полностью изменить внешний вид и композицию тела David. Вместо формы с повышенным процентом жира была создана сухая, спортивная и визуально атлетичная физическая форма.</p>'},
    pl:{title:'OD WYSOKIEGO POZIOMU TKANKI TŁUSZCZOWEJ DO ATLETYCZNEJ SYLWETKI W 8 MIESIĘCY',meta:'David · Deficyt kaloryczny · Zachowanie masy mięśniowej',reviewLabel:'',text:'<h4>Sytuacja wyjściowa</h4><p>David zgłosił się z celem redukcji tkanki tłuszczowej, poprawy kompozycji ciała i budowy jakościowej masy mięśniowej.</p><p>Przed rozpoczęciem współpracy miał już doświadczenie treningowe na siłowni, jednak po przerwie wrócił do ćwiczeń i postanowił podejść do procesu bardziej systemowo. Mimo własnej wiedzy z zakresu fitness i nauki w akademii trenerskiej, chciał powierzyć budowę strategii przygotowania zewnętrznemu specjaliście.</p><p>Na starcie miał podwyższony poziom tkanki tłuszczowej i niewystarczającą masę mięśniową do wymarzonej sylwetki.</p><h4>Cel</h4><ul><li>Redukcja poziomu tkanki tłuszczowej.</li><li>Bardziej rzeźbiona i sportowa sylwetka.</li><li>Zachowanie i zwiększenie masy mięśniowej podczas redukcji.</li><li>Zbudowanie efektywnego systemu żywienia i treningów.</li></ul><h4>Co zostało zrobione</h4><p>Opracowano kompleksową strategię obejmującą treningi, żywienie i kontrolę codziennej aktywności.</p><p>Głównym zadaniem było stworzenie trwałego deficytu kalorycznego bez nadmiernych ograniczeń, utrzymanie wydajności treningowej i zapewnienie maksymalnego zachowania masy mięśniowej przez cały okres przygotowań.</p><p>W trakcie pracy program był regularnie korygowany w zależności od postępów i aktualnego stanu.</p><h4>Rezultat po 8 miesiącach</h4><ul><li>Znaczna redukcja poziomu tkanki tłuszczowej.</li><li>Wyraźna poprawa rzeźby i jakości ciała.</li><li>Zachowanie i rozwój masy mięśniowej podczas redukcji.</li><li>Ukształtowanie sportowej i estetycznej sylwetki.</li><li>Poprawa ogólnego poziomu sprawności fizycznej i samopoczucia.</li></ul><p class="case-note">W ciągu 8 miesięcy udało się całkowicie zmienić wygląd i kompozycję ciała Davida — z sylwetki o podwyższonym poziomie tłuszczu do suchej, sportowej i wizualnie atletycznej formy.</p>'}
  },
  sergey:{
    img:ASSET+'case-sergey.webp',
    reviewImg:null,
    uk:{title:'+10 КГ МАСИ ЗА 3 МІСЯЦІ З ПОСТІЙНИМ КОНТРОЛЕМ ЗДОРОВ\'Я',meta:'Sergey · Набір маси · Контроль аналізів',reviewLabel:'',text:"<h4>З чим прийшов</h4><p>Sergey прийшов після приблизно 6 місяців без силових тренувань — за цей час втратив близько 8 кг і хотів повернути форму. Минулого разу, коли набирав масу, у нього полізли висипання на шкірі і трохи \"поїхали\" аналізи, тож цього разу завдання було не просто набрати, а зробити це акуратно, під контролем.</p><h4>Що робили</h4><ul><li>Зібрали персональну програму тренувань.</li><li>Повністю перезібрали харчування — близько 700 г вуглеводів, 170–180 г білка, 60 г жиру.</li><li>Підключили спортивну фармакологію, але з регулярною здачею аналізів.</li><li>Шкірою займались разом з його лікарем.</li></ul><h4>Результат</h4><ul><li>Більше 10 кг маси всього за 3 місяці.</li><li>Попередня форма не просто повернулась — стала кращою.</li><li>М'язові об'єми помітно виросли.</li><li>Шкіра стала чистішою.</li><li>Усі аналізи весь цей час трималися в нормі.</li></ul><p class=\"case-note\">За 3 місяці вдалося не просто повернути форму, а зробити це з постійним контролем здоров'я. Далі Sergey вже тренувався сам і продовжив розвивати результат.</p>"},
    en:{title:'+10 KG OF MASS IN 3 MONTHS WITH CONTINUOUS HEALTH MONITORING',meta:'Sergey · Mass gain · Blood work monitoring',reviewLabel:'',text:"<h4>Where he started</h4><p>Sergey came to me after about 6 months without strength training — during that time he'd lost around 8 kg and wanted his shape back. Last time he bulked, he broke out in acne and his blood work went slightly off, so this time the goal wasn't just to gain — it was to do it carefully, under control.</p><h4>What we did</h4><ul><li>Put together a personal training program.</li><li>Completely rebuilt his nutrition — around 700 g carbs, 170–180 g protein, 60 g fat.</li><li>Used sports pharmacology, but with regular blood work along the way.</li><li>Worked on his skin together with his doctor.</li></ul><h4>Result</h4><ul><li>Over 10 kg of mass in just 3 months.</li><li>His old shape didn't just come back — it came back better.</li><li>Muscle size grew noticeably.</li><li>His skin cleared up.</li><li>Blood work stayed within normal range the entire time.</li></ul><p class=\"case-note\">In 3 months he didn't just get his shape back — he did it while keeping his health under constant check. After that, Sergey kept training on his own and built on the result.</p>"},
    ru:{title:'+10 КГ МАССЫ ЗА 3 МЕСЯЦА С ПОСТОЯННЫМ КОНТРОЛЕМ ЗДОРОВЬЯ',meta:'Sergey · Набор массы · Контроль анализов',reviewLabel:'',text:'<h4>С чем пришёл</h4><p>Сергей пришёл после примерно полугода без тренировок — за это время потерял около 8 кг и хотел вернуть форму. В прошлый раз, когда набирал массу, у него полезли высыпания на коже и слегка «поехали» анализы, так что в этот раз задача была не просто набрать, а сделать это аккуратно, под контролем.</p><h4>Что делали</h4><ul><li>Собрали персональную программу тренировок.</li><li>Полностью пересобрали питание — около 700 г углеводов, 170–180 г белка, 60 г жира.</li><li>Подключили спортивную фармакологию, но с регулярной сдачей анализов.</li><li>Кожей занимались вместе с его врачом.</li></ul><h4>Результат</h4><ul><li>Больше 10 кг массы всего за 3 месяца.</li><li>Прежняя форма не просто вернулась — стала лучше.</li><li>Мышечные объёмы заметно выросли.</li><li>Кожа стала чище.</li><li>Все анализы всё это время держались в норме.</li></ul><p class="case-note">За 3 месяца получилось не просто вернуть форму, а сделать это с постоянным контролем здоровья. Дальше Сергей уже тренировался сам и продолжил развивать результат.</p>'},
    pl:{title:'+10 KG MASY W 3 MIESIĄCE Z CIĄGŁĄ KONTROLĄ ZDROWIA',meta:'Sergey · Budowa masy · Monitoring badań',reviewLabel:'',text:"<h4>Z czym przyszedł</h4><p>Sergey przyszedł po około 6 miesiącach bez treningu siłowego — w tym czasie stracił około 8 kg i chciał wrócić do formy. Ostatnim razem, gdy budował masę, wyskoczył mu trądzik i lekko \"pojechały\" badania, więc tym razem zadaniem było nie tylko zbudować masę, ale zrobić to ostrożnie, pod kontrolą.</p><h4>Co zrobiliśmy</h4><ul><li>Ułożyliśmy indywidualny program treningowy.</li><li>Całkowicie przebudowaliśmy żywienie — około 700 g węglowodanów, 170–180 g białka, 60 g tłuszczu.</li><li>Włączyliśmy farmakologię sportową, ale z regularnymi badaniami.</li><li>Nad stanem skóry pracowaliśmy razem z jego lekarzem.</li></ul><h4>Rezultat</h4><ul><li>Ponad 10 kg masy w zaledwie 3 miesiące.</li><li>Poprzednia forma nie tylko wróciła — stała się lepsza.</li><li>Objętości mięśniowe wyraźnie wzrosły.</li><li>Skóra się wyczyściła.</li><li>Wszystkie badania cały czas trzymały się normy.</li></ul><p class=\"case-note\">W 3 miesiące udało się nie tylko odzyskać formę, ale zrobić to przy stałej kontroli zdrowia. Później Sergey trenował już sam i rozwijał osiągnięty wynik.</p>"}
  },
  artem:{
    img:ASSET+'case-artem.webp',
    reviewImg:null,
    extraImgs:[ASSET+'case-artem-2.webp',ASSET+'case-artem-3.webp'],
    uk:{title:'РЕКОМПОЗИЦІЯ ТІЛА ТА ПОБУДОВА СПОРТИВНОЇ ФОРМИ',meta:'Artem · Довгострокова стратегія · -10% жиру · +маса',reviewLabel:'',text:"<h4>З чого починав</h4><p>Коли я тільки почав займатися, у мене було близько 20% жиру і майже не було м'язів. Мета була не просто \"підкачатись\" — я хотів розібратися в тренуваннях, харчуванні й відновленні настільки глибоко, щоб потім застосовувати це вже в роботі з клієнтами.</p><h4>Що робив</h4><ul><li>Вибудував для себе довгострокову стратегію тренувань.</li><li>Повністю налагодив харчування і контроль калорій.</li><li>Постійно аналізував результат і коригував програму.</li><li>Регулярно перевіряв здоров'я.</li></ul><h4>Результат</h4><ul><li>За останні півтора року помітно виріс у м'язовій масі.</li><li>Жир знизив приблизно з 20% до 12%.</li><li>Отримав спортивну, пропорційну форму.</li><li>А головне — набрався практичного досвіду, який тепер лежить в основі того, як я готую своїх клієнтів.</li></ul><p class=\"case-note\">Цей шлях навчив мене не лише змінювати своє тіло, а й розуміти кожен етап трансформації зсередини. Тому більшість рекомендацій, які отримують мої клієнти, я спочатку перевірив на собі.</p>"},
    en:{title:'BODY RECOMPOSITION AND BUILDING AN ATHLETIC PHYSIQUE',meta:'Artem · Long-term strategy · -10% body fat · +muscle mass',reviewLabel:'',text:"<h4>Where I started</h4><p>When I started training, I had around 20% body fat and barely any muscle. The goal wasn't just to \"get in shape\" — I wanted to understand training, nutrition and recovery deeply enough to later use that in my work with clients.</p><h4>What I did</h4><ul><li>Built myself a long-term training strategy.</li><li>Fully dialled in nutrition and calorie control.</li><li>Kept analysing my results and adjusting the program.</li><li>Checked my health regularly.</li></ul><h4>Result</h4><ul><li>Noticeably more muscle mass over the last year and a half.</li><li>Body fat down from around 20% to about 12%.</li><li>Built an athletic, proportional physique.</li><li>And most importantly — gained hands-on experience that now shapes how I train my clients.</li></ul><p class=\"case-note\">This journey taught me not just how to change my own body, but how to understand every stage of a transformation from the inside. That's why most of the advice my clients get, I tested on myself first.</p>"},
    ru:{title:'РЕКОМПОЗИЦИЯ ТЕЛА И СОЗДАНИЕ СПОРТИВНОЙ ФОРМЫ',meta:'Artem · Долгосрочная стратегия · -10% жира · +масса',reviewLabel:'',text:'<h4>С чего начинал</h4><p>Когда я только начинал заниматься, у меня было около 20% жира и почти не было мышц. Цель была не просто «подкачаться» — я хотел разобраться в тренировках, питании и восстановлении настолько глубоко, чтобы потом применять это уже в работе с клиентами.</p><h4>Что делал</h4><ul><li>Выстроил для себя долгосрочную стратегию тренировок.</li><li>Полностью наладил питание и контроль калорий.</li><li>Постоянно анализировал результат и корректировал программу.</li><li>Регулярно проверял здоровье.</li></ul><h4>Результат</h4><ul><li>За последние полтора года заметно вырос в мышечной массе.</li><li>Жир снизил примерно с 20% до 12%.</li><li>Получил спортивную, пропорциональную форму.</li><li>А главное — набрался практического опыта, который теперь лежит в основе того, как я готовлю своих клиентов.</li></ul><p class="case-note">Этот путь научил меня не только менять своё тело, но и понимать каждый этап трансформации изнутри. Поэтому большинство рекомендаций, которые получают мои клиенты, я сначала проверил на себе.</p>'},
    pl:{title:'REKOMPOZYCJA CIAŁA I BUDOWA ATLETYCZNEJ SYLWETKI',meta:'Artem · Długoterminowa strategia · -10% tłuszczu · +masa',reviewLabel:'',text:"<h4>Od czego zaczynałem</h4><p>Kiedy zaczynałem treningi, miałem około 20% tkanki tłuszczowej i prawie żadnych mięśni. Celem nie było po prostu \"się dorobić\" — chciałem zrozumieć trening, żywienie i regenerację na tyle głęboko, żeby potem wykorzystać to w pracy z klientami.</p><h4>Co robiłem</h4><ul><li>Zbudowałem dla siebie długoterminową strategię treningową.</li><li>W pełni ogarnąłem żywienie i kontrolę kalorii.</li><li>Cały czas analizowałem efekty i korygowałem program.</li><li>Regularnie sprawdzałem zdrowie.</li></ul><h4>Rezultat</h4><ul><li>Przez ostatnie półtora roku wyraźnie zwiększyłem masę mięśniową.</li><li>Tłuszcz obniżyłem z około 20% do około 12%.</li><li>Zbudowałem sportową, proporcjonalną sylwetkę.</li><li>A najważniejsze — zdobyłem praktyczne doświadczenie, które teraz jest podstawą tego, jak przygotowuję swoich klientów.</li></ul><p class=\"case-note\">Ta droga nauczyła mnie nie tylko zmieniać własne ciało, ale rozumieć każdy etap transformacji od środka. Dlatego większość rekomendacji, które dostają moi klienci, najpierw przetestowałem na sobie.</p>"}
  },
  sonya:{
    img:ASSET+'case-sonya-v2.webp',
    reviewImg:null,
    uk:{title:'ВІДНОВЛЕННЯ ЦИКЛУ ТА НАБІР М\'ЯЗОВОЇ МАСИ',meta:'Sonya · Відновлення циклу · Набір м\'язової маси · Покращення пропорцій · 5 місяців роботи',reviewLabel:'',text:"<h4>З чим прийшла</h4><p>Соня прийшла до мене після роботи з іншим тренером. Вона вже кілька років тренувалася в залі і перебувала у дуже хорошій формі — за рівнем м'язової маси вже була близька до спортсменок категорії фітнес-бікіні.</p><p>При цьому після тривалого і важкого сушіння у неї був відсутній менструальний цикл, самопочуття було не найкращим, з'явилася втома, а прогрес у силі та м'язовій масі почав сповільнюватися і місцями йти назад.</p><p>Також були нюанси в техніці виконання вправ. Особливо це було помітно у вправах на спину. Техніка була цілком робочою, але було достатньо моментів, які потрібно було виправити: контроль руху, амплітуда та інші технічні деталі. Завдання полягало в тому, щоб довести виконання вправ до професійного рівня.</p><h4>Що було зроблено</h4><ul><li>Повністю переробили тренувальну програму і систему харчування.</li><li>Поступово вивели харчування на потрібний рівень — переважно близько 400 г вуглеводів на день.</li><li>Підібрали найефективніші вправи і переробили техніку їх виконання.</li><li>Довели контроль руху, амплітуду та інші технічні деталі до професійного рівня.</li><li>Вибудували систему з 4 різних тренувань на тиждень: 2 тренування низу, 1 верху і 1 Full Body.</li><li>Ретельно розрахували обсяг і навантаження: навіть на пріоритетні м'язові групи обсяг не перевищував приблизно 10 робочих підходів на тиждень.</li></ul><h4>Результат за 5 місяців</h4><ul><li>Повністю відновили менструальний цикл — далі він проходив стабільно, без повторних проблем.</li><li>Значно збільшили м'язову масу зі збереженням низького відсотка жиру.</li><li>Сильно покращили пропорції тіла, особливо за рахунок спини, сідниць та задньої поверхні стегна.</li><li>Значно покращили техніку і силові показники.</li><li>Сідничний місток: 130–140 кг → 160 кг. При цьому на 160 кг техніка стала значно кращою: плавне контрольоване виконання і паузи в ключових точках руху.</li></ul><p>У підсумку Соня зберегла приблизно той самий рівень сухості, з яким прийшла після попереднього сушіння, але стала помітно більш м'язистою, сильнішою і пропорційною.</p><p class=\"case-note\">Головне — вдалося одночасно покращити форму і силові показники, повернути нормальне самопочуття і відновити стабільний менструальний цикл. Зараз Соня повністю задоволена результатом.</p>"},
    en:{title:'RESTORING THE CYCLE AND BUILDING MUSCLE MASS',meta:'Sonya · Cycle restoration · Muscle mass gain · Improved proportions · 5 months of work',reviewLabel:'',text:"<h4>Where she started</h4><p>Sonya came to me after working with another trainer. She had already been training in the gym for several years and was in very good shape — her muscle mass level was already close to that of bikini fitness category athletes.</p><p>At the same time, after a long and heavy cut, she had no menstrual cycle, wasn't feeling her best, felt fatigued, and her progress in strength and muscle mass had started to slow down and, in places, reverse.</p><p>There were also some nuances in her exercise technique, especially noticeable in back exercises. The technique was reasonably solid, but there were quite a few things to fix: movement control, range of motion and other technical details. The goal was to bring her execution up to a professional level.</p><h4>What we did</h4><ul><li>Completely reworked the training program and nutrition system.</li><li>Gradually brought nutrition up to the required level — mainly around 400 g of carbs per day.</li><li>Selected the most effective exercises and reworked their technique.</li><li>Brought movement control, range of motion and other technical details up to a professional level.</li><li>Built a system of 4 different sessions per week: 2 lower-body sessions, 1 upper-body and 1 full body.</li><li>Carefully calculated volume and load: even for priority muscle groups, volume never exceeded around 10 working sets per week.</li></ul><h4>Result after 5 months</h4><ul><li>Fully restored her menstrual cycle — it stayed stable afterward, with no recurring issues.</li><li>Significantly increased muscle mass while keeping body fat low.</li><li>Greatly improved body proportions, especially through the back, glutes and hamstrings.</li><li>Significantly improved technique and strength numbers.</li><li>Hip thrust: 130–140 kg → 160 kg. And at 160 kg her technique became noticeably better: smooth, controlled execution with pauses at key points in the movement.</li></ul><p>In the end, Sonya kept roughly the same level of leanness she came in with after her previous cut, but became noticeably more muscular, stronger and more proportional.</p><p class=\"case-note\">The main thing — we managed to improve both her physique and her strength numbers at the same time, restore how she felt day to day, and get her menstrual cycle back to being stable. Sonya is now fully happy with the result.</p>"},
    ru:{title:'ВОССТАНОВЛЕНИЕ ЦИКЛА И НАБОР МЫШЕЧНОЙ МАССЫ',meta:'Sonya · Восстановление цикла · Набор мышечной массы · Улучшение пропорций · 5 месяцев работы',reviewLabel:'',text:"<h4>С чем пришла</h4><p>Соня пришла ко мне после работы с другим тренером. Она уже несколько лет тренировалась в зале и находилась в очень хорошей форме — по уровню мышечной массы уже была близка к спортсменкам категории фитнес-бикини.</p><p>При этом после длительной и тяжёлой сушки у неё отсутствовал менструальный цикл, было не самое лучшее самочувствие, появилась усталость, а прогресс в силе и мышечной массе начал замедляться и местами идти назад.</p><p>Также были нюансы в технике выполнения упражнений. Особенно это было заметно в упражнениях на спину. Техника была вполне рабочей, но было достаточно моментов, которые нужно было исправить: контроль движения, амплитуда и другие технические детали. Задача была довести выполнение упражнений до профессионального уровня.</p><h4>Что было сделано</h4><ul><li>Полностью переработали тренировочную программу и систему питания.</li><li>Постепенно вывели питание на необходимый уровень — в основном около 400 г углеводов в день.</li><li>Подобрали наиболее эффективные упражнения и переработали технику их выполнения.</li><li>Довели контроль движения, амплитуду и другие технические детали до профессионального уровня.</li><li>Выстроили систему из 4 разных тренировок в неделю: 2 тренировки низа, 1 верха и 1 Full Body.</li><li>Тщательно рассчитали объём и нагрузку: даже на приоритетные мышечные группы объём не превышал примерно 10 рабочих подходов в неделю.</li></ul><h4>Результат за 5 месяцев</h4><ul><li>Полностью восстановили менструальный цикл — дальше он проходил стабильно, без повторных проблем.</li><li>Значительно увеличили мышечную массу при сохранении низкого процента жира.</li><li>Сильно улучшили пропорции тела, особенно за счёт спины, ягодиц и задней поверхности бедра.</li><li>Значительно улучшили технику и силовые показатели.</li><li>Ягодичный мостик: 130–140 кг → 160 кг. При этом на 160 кг техника стала значительно лучше: плавное контролируемое выполнение и паузы в ключевых точках движения.</li></ul><p>В итоге Соня сохранила примерно тот же уровень сухости, с которым пришла после предыдущей сушки, но стала заметно более мышечной, сильной и пропорциональной.</p><p class=\"case-note\">Главное — удалось одновременно улучшить форму и силовые показатели, вернуть нормальное самочувствие и восстановить стабильный менструальный цикл. Сейчас Соня полностью довольна результатом.</p>"},
    pl:{title:'PRZYWRÓCENIE CYKLU I BUDOWA MASY MIĘŚNIOWEJ',meta:'Sonya · Przywrócenie cyklu · Budowa masy mięśniowej · Poprawa proporcji · 5 miesięcy pracy',reviewLabel:'',text:"<h4>Z czym przyszła</h4><p>Sonya zgłosiła się do mnie po współpracy z innym trenerem. Trenowała już od kilku lat na siłowni i była w bardzo dobrej formie — pod względem masy mięśniowej była już bliska poziomowi zawodniczek kategorii bikini fitness.</p><p>Przy tym po długiej i ciężkiej redukcji nie miała cyklu miesiączkowego, samopoczucie nie było najlepsze, pojawiło się zmęczenie, a progres w sile i masie mięśniowej zaczął zwalniać, a miejscami wręcz się cofać.</p><p>Były też pewne niuanse w technice wykonania ćwiczeń, szczególnie widoczne przy ćwiczeniach na plecy. Technika była całkiem sprawna, ale było sporo elementów do poprawy: kontrola ruchu, amplituda i inne szczegóły techniczne. Zadaniem było doprowadzenie wykonania ćwiczeń do poziomu profesjonalnego.</p><h4>Co zostało zrobione</h4><ul><li>Całkowicie przebudowaliśmy program treningowy i system żywienia.</li><li>Stopniowo doprowadziliśmy żywienie do potrzebnego poziomu — głównie około 400 g węglowodanów dziennie.</li><li>Dobraliśmy najskuteczniejsze ćwiczenia i przepracowaliśmy technikę ich wykonania.</li><li>Doprowadziliśmy kontrolę ruchu, amplitudę i inne szczegóły techniczne do poziomu profesjonalnego.</li><li>Ułożyliśmy system 4 różnych treningów w tygodniu: 2 treningi dołu, 1 góry i 1 Full Body.</li><li>Starannie obliczyliśmy objętość i obciążenie: nawet dla priorytetowych partii mięśniowych objętość nie przekraczała ok. 10 serii roboczych tygodniowo.</li></ul><h4>Rezultat po 5 miesiącach</h4><ul><li>W pełni przywróciliśmy cykl miesiączkowy — dalej przebiegał stabilnie, bez ponownych problemów.</li><li>Znacząco zwiększyliśmy masę mięśniową przy zachowaniu niskiego poziomu tkanki tłuszczowej.</li><li>Mocno poprawiliśmy proporcje ciała, szczególnie dzięki plecom, pośladkom i tylnej części ud.</li><li>Znacząco poprawiliśmy technikę i wyniki siłowe.</li><li>Hip thrust: 130–140 kg → 160 kg. Przy czym na 160 kg technika stała się znacznie lepsza: płynne, kontrolowane wykonanie i pauzy w kluczowych punktach ruchu.</li></ul><p>W efekcie Sonya zachowała mniej więcej ten sam poziom rzeźby, z jakim przyszła po poprzedniej redukcji, ale stała się wyraźnie bardziej umięśniona, silniejsza i proporcjonalna.</p><p class=\"case-note\">Najważniejsze — udało się jednocześnie poprawić sylwetkę i wyniki siłowe, przywrócić dobre samopoczucie i ustabilizować cykl miesiączkowy. Obecnie Sonya jest w pełni zadowolona z rezultatu.</p>"}
  
  },

  kostia:{
    img:ASSET+'case-kostia.webp',
    reviewImg:null,
    extraImgs:[ASSET+'case-kostia-xray.webp'],
    uk:{title:'ТРЕНУВАННЯ ПІСЛЯ ОПЕРАЦІЇ ПРИ ТЯЖКОМУ СКОЛІОЗІ',meta:'Kostia · Після операції на хребті · безпечні тренування',reviewLabel:'',text:"<h4>З чим прийшов</h4><p>Kostia прийшов до мене після операції з приводу тяжкого сколіозу. Незважаючи на операцію і титанові конструкції в спині, викривлення нікуди не поділося. Від попереднього тренера у нього була програма з купою осьового навантаження на хребет, хоча лікар прямо сказав — від таких вправ треба повністю відмовитись.</p><h4>Що робили</h4><ul><li>Повністю перезібрали програму тренувань.</li><li>Прибрали все, що дає осьове навантаження на хребет.</li><li>Додали безпечні вправи на кор і підтримку спини.</li><li>Поправили техніку.</li></ul><h4>Результат</h4><ul><li>Перейшов на повністю безпечний тренувальний процес.</li><li>Тренування стали в задоволення.</li><li>Програма повністю збігається з тим, що рекомендував лікар.</li><li>Після консультації продовжив тренуватися сам, за складеним планом.</li></ul><p class=\"case-note\">Навіть при такому непростому стані хребта вдалося вибудувати безпечну систему тренувань — вона підтримує здоров'я, дає прогрес і не відбиває бажання займатись.</p>"},
    en:{title:'TRAINING AFTER SURGERY WITH SEVERE SCOLIOSIS',meta:'Kostia · After spinal surgery · safe training',reviewLabel:'',text:"<h4>Where he started</h4><p>Kostia came to me after surgery for severe scoliosis. Despite the surgery and the titanium hardware in his spine, the curve was still there. His previous trainer had given him a program loaded with axial spinal load, even though his doctor had told him directly to avoid that kind of exercise entirely.</p><h4>What we did</h4><ul><li>Completely rebuilt his training program.</li><li>Cut out anything that loads the spine axially.</li><li>Added safe core work to support the spine.</li><li>Cleaned up his technique.</li></ul><h4>Result</h4><ul><li>Moved to a fully safe training process.</li><li>Training actually became enjoyable.</li><li>The program matches exactly what his doctor recommended.</li><li>After the consultation he kept training on his own, following the plan.</li></ul><p class=\"case-note\">Even with such a complex spinal condition, we managed to build a safe training system — one that supports his health, still gives him progress, and doesn't kill his motivation to train.</p>"},
    ru:{title:'ТРЕНИРОВКИ ПОСЛЕ ОПЕРАЦИИ ПРИ ТЯЖЁЛОМ СКОЛИОЗЕ',meta:'Kostia · После операции на позвоночнике · безопасные тренировки',reviewLabel:'',text:'<h4>С чем пришёл</h4><p>Костя пришёл ко мне после операции по поводу тяжёлого сколиоза. Несмотря на операцию и титановые конструкции в спине, искривление никуда не делось. От предыдущего тренера у него была программа с кучей осевой нагрузки на позвоночник, хотя врач прямо сказал — от таких упражнений нужно полностью отказаться.</p><h4>Что делали</h4><ul><li>Полностью пересобрали программу тренировок.</li><li>Убрали всё, что даёт осевую нагрузку на позвоночник.</li><li>Добавили безопасные упражнения на кор и поддержку спины.</li><li>Поправили технику.</li></ul><h4>Результат</h4><ul><li>Перешёл на полностью безопасный тренировочный процесс.</li><li>Тренировки стали в удовольствие.</li><li>Программа полностью совпадает с тем, что рекомендовал врач.</li><li>После консультации продолжил тренироваться сам, по составленному плану.</li></ul><p class="case-note">Даже при таком непростом состоянии позвоночника получилось выстроить безопасную систему тренировок — она поддерживает здоровье, даёт прогресс и не отбивает желание заниматься.</p>'},
    pl:{title:'TRENING PO OPERACJI PRZY CIĘŻKIEJ SKOLIOZIE',meta:'Kostia · Po operacji kręgosłupa · bezpieczny trening',reviewLabel:'',text:"<h4>Z czym przyszedł</h4><p>Kostia przyszedł do mnie po operacji z powodu ciężkiej skoliozy. Mimo operacji i tytanowych implantów w plecach, skrzywienie nigdzie nie zniknęło. Od poprzedniego trenera miał program pełen obciążenia osiowego kręgosłupa, chociaż lekarz wprost powiedział — z takich ćwiczeń trzeba całkowicie zrezygnować.</p><h4>Co zrobiliśmy</h4><ul><li>Całkowicie przebudowaliśmy program treningowy.</li><li>Wyrzuciliśmy wszystko, co daje obciążenie osiowe kręgosłupa.</li><li>Dodaliśmy bezpieczne ćwiczenia na core wspierające plecy.</li><li>Poprawiliśmy technikę.</li></ul><h4>Rezultat</h4><ul><li>Przeszedł na w pełni bezpieczny proces treningowy.</li><li>Trening zaczął sprawiać przyjemność.</li><li>Program w pełni pokrywa się z tym, co zalecił lekarz.</li><li>Po konsultacji trenował już sam, według ustalonego planu.</li></ul><p class=\"case-note\">Nawet przy tak trudnym stanie kręgosłupa udało się zbudować bezpieczny system treningowy — wspiera zdrowie, daje progres i nie odbiera chęci do treningu.</p>"}
  },

  yulia:{
    img:ASSET+'case-yulia.webp',
    reviewImg:null,
    extraImgs:[ASSET+'case-yulia-2.webp'],
    uk:{title:'РЕКОМПОЗИЦІЯ ТІЛА ПРИ ГІПОТИРЕОЗІ ТА ІНСУЛІНОРЕЗИСТЕНТНОСТІ',meta:'Yulia · Рекомпозиція тіла · Гіпотиреоз · Інсулінорезистентність · Проблеми із суглобами · 1,5 року роботи',reviewLabel:'',text:"<h4>З чим прийшла</h4><p>Юля прийшла до мене з метою знизити вагу, прибрати зайвий жир і зробити тіло більш підтягнутим. На старті вона важила близько 77–78 кг.</p><p>При цьому у неї були гіпотиреоз, інсулінорезистентність, не найкращий ліпідний профіль та періодичні запалення і болі в променево-зап'ясткових суглобах. Тому тренувальний процес довелося адаптувати під її стан і поступово вибудовувати комфортне навантаження.</p><h4>Що було зроблено</h4><ul><li>Поступово вибудували регулярні силові тренування з урахуванням її особливостей.</li><li>Підібрали вправи і навантаження так, щоб тренування були ефективними і комфортними для суглобів.</li><li>Поступово покращили харчування і повсякденну активність без жорстких обмежень.</li><li>Паралельно зі зниженням ваги працювали над набором м'язової маси і пропорційним розвитком усього тіла.</li><li>Основний результат зі зниження ваги отримали приблизно за перші 6–8 місяців, після чого перейшли до підтримки комфортної для Юлі форми.</li></ul><h4>Результат за 1,5 року</h4><ul><li>Вага знизилася приблизно з 77–78 кг до 65 кг — близько −13 кг.</li><li>При цьому було набрано значну кількість м'язової маси, тому візуальні зміни виявилися набагато більшими, ніж просто зниження цифри на вагах.</li><li>Тіло стало значно більш підтягнутим і спортивним: помітно розвинулися сідниці, ноги, плечі та спина.</li><li>При зрості близько 155 см завдяки розвиненій мускулатурі Юля стала виглядати дуже спортивно навіть у звичайному одязі.</li><li>Сідничний місток — 140–150 кг в ідеальній, повністю контрольованій техніці.</li><li>М'язова маса розвивалася пропорційно, без виражених дисбалансів між окремими групами.</li></ul><p>У підсумку Юля прийшла до форми, яка її повністю влаштовує: без екстремальної сухості, але з великою кількістю м'язової маси, гарними пропорціями і вираженим спортивним зовнішнім виглядом.</p><p class=\"case-note\">Далі ми вже переважно підтримували цю форму і продовжували прогресувати в тренуваннях.</p>"},
    en:{title:'BODY RECOMPOSITION WITH HYPOTHYROIDISM AND INSULIN RESISTANCE',meta:'Yulia · Body recomposition · Hypothyroidism · Insulin resistance · Joint issues · 1.5 years of work',reviewLabel:'',text:"<h4>Where she started</h4><p>Yulia came to me wanting to lose weight, get rid of excess fat and make her body more toned. At the start she weighed around 77–78 kg.</p><p>She also had hypothyroidism, insulin resistance, a less-than-ideal lipid profile, and periodic inflammation and pain in her wrist joints. Because of this, the training process had to be adapted to her condition, gradually building up a comfortable load.</p><h4>What we did</h4><ul><li>Gradually built up regular strength training that accounted for her specific needs.</li><li>Selected exercises and loads so training would be effective and comfortable for her joints.</li><li>Gradually improved her nutrition and daily activity without strict restrictions.</li><li>Alongside the weight loss, worked on building muscle mass and developing her whole body proportionally.</li><li>Got the main weight-loss result in roughly the first 6–8 months, then shifted to maintaining a shape Yulia was comfortable with.</li></ul><h4>Result after 1.5 years</h4><ul><li>Weight dropped from around 77–78 kg to 65 kg — about −13 kg.</li><li>At the same time she gained a significant amount of muscle mass, so the visual changes turned out to be much bigger than just the drop in the number on the scale.</li><li>Her body became noticeably more toned and athletic: her glutes, legs, shoulders and back developed visibly.</li><li>At around 155 cm tall, thanks to her developed muscle, Yulia started looking very athletic even in regular clothes.</li><li>Hip thrust — 140–150 kg with perfect, fully controlled technique.</li><li>Muscle mass developed proportionally, without noticeable imbalances between muscle groups.</li></ul><p>In the end, Yulia reached a shape she's fully happy with: not extremely lean, but with a lot of muscle mass, good proportions and a clearly athletic look.</p><p class=\"case-note\">After that, we mostly maintained this shape and kept progressing in training.</p>"},
    ru:{title:'РЕКОМПОЗИЦИЯ ТЕЛА ПРИ ГИПОТИРЕОЗЕ И ИНСУЛИНОРЕЗИСТЕНТНОСТИ',meta:'Yulia · Рекомпозиция тела · Гипотиреоз · Инсулинорезистентность · Проблемы с суставами · 1,5 года работы',reviewLabel:'',text:"<h4>С чем пришла</h4><p>Юля пришла ко мне с целью снизить вес, убрать лишний жир и сделать тело более подтянутым. На старте она весила около 77–78 кг.</p><p>При этом у неё были гипотиреоз, инсулинорезистентность, не самый лучший липидный профиль и периодические воспаления и боли в кистевых суставах. Поэтому тренировочный процесс пришлось адаптировать под её состояние и постепенно выстраивать комфортную нагрузку.</p><h4>Что было сделано</h4><ul><li>Постепенно выстроили регулярные силовые тренировки с учётом её особенностей.</li><li>Подобрали упражнения и нагрузку так, чтобы тренировки были эффективными и комфортными для суставов.</li><li>Постепенно улучшили питание и повседневную активность без жёстких ограничений.</li><li>Параллельно со снижением веса работали над набором мышечной массы и пропорциональным развитием всего тела.</li><li>Основной результат по снижению веса получили примерно за первые 6–8 месяцев, после чего перешли к поддержанию комфортной для Юли формы.</li></ul><h4>Результат за 1,5 года</h4><ul><li>Вес снизился примерно с 77–78 кг до 65 кг — около −13 кг.</li><li>При этом было набрано значительное количество мышечной массы, поэтому визуальные изменения оказались намного больше, чем просто снижение цифры на весах.</li><li>Тело стало значительно более подтянутым и спортивным: заметно развились ягодицы, ноги, плечи и спина.</li><li>При росте около 155 см за счёт развитой мускулатуры Юля стала выглядеть очень спортивно даже в обычной одежде.</li><li>Ягодичный мостик — 140–150 кг в идеальной, полностью контролируемой технике.</li><li>Мышечная масса развивалась пропорционально, без выраженных дисбалансов между отдельными группами.</li></ul><p>В итоге Юля пришла к форме, которая её полностью устраивает: без экстремальной сухости, но с большим количеством мышечной массы, хорошими пропорциями и выраженным спортивным внешним видом.</p><p class=\"case-note\">Дальше мы уже в основном поддерживали эту форму и продолжали прогрессировать в тренировках.</p>"},
    pl:{title:'REKOMPOZYCJA SYLWETKI PRZY NIEDOCZYNNOŚCI TARCZYCY I INSULINOOPORNOŚCI',meta:'Yulia · Rekompozycja sylwetki · Niedoczynność tarczycy · Insulinooporność · Problemy ze stawami · 1,5 roku pracy',reviewLabel:'',text:"<h4>Z czym przyszła</h4><p>Yulia zgłosiła się do mnie z celem zrzucenia wagi, pozbycia się nadmiaru tkanki tłuszczowej i uzyskania bardziej jędrnego ciała. Na starcie ważyła około 77–78 kg.</p><p>Miała przy tym niedoczynność tarczycy, insulinooporność, niezbyt dobry profil lipidowy oraz okresowe stany zapalne i bóle stawów nadgarstkowych. Dlatego proces treningowy trzeba było dostosować do jej stanu i stopniowo budować komfortowe obciążenie.</p><h4>Co zostało zrobione</h4><ul><li>Stopniowo wprowadziliśmy regularne treningi siłowe z uwzględnieniem jej cech.</li><li>Dobraliśmy ćwiczenia i obciążenie tak, aby treningi były skuteczne i komfortowe dla stawów.</li><li>Stopniowo poprawiliśmy żywienie i codzienną aktywność bez sztywnych ograniczeń.</li><li>Równolegle ze spadkiem wagi pracowaliśmy nad budową masy mięśniowej i proporcjonalnym rozwojem całego ciała.</li><li>Główny efekt w postaci spadku wagi uzyskaliśmy w ciągu pierwszych 6–8 miesięcy, po czym przeszliśmy do utrzymania formy komfortowej dla Yulii.</li></ul><h4>Rezultat po 1,5 roku</h4><ul><li>Waga spadła z około 77–78 kg do 65 kg — czyli o ok. −13 kg.</li><li>Przy tym zbudowano znaczną ilość masy mięśniowej, więc zmiany wizualne okazały się dużo większe niż sam spadek liczby na wadze.</li><li>Ciało stało się znacznie bardziej jędrne i sportowe: wyraźnie rozwinęły się pośladki, nogi, barki i plecy.</li><li>Przy wzroście ok. 155 cm, dzięki rozwiniętej muskulaturze, Yulia zaczęła wyglądać bardzo sportowo nawet w zwykłych ubraniach.</li><li>Hip thrust — 140–150 kg w idealnej, w pełni kontrolowanej technice.</li><li>Masa mięśniowa rozwijała się proporcjonalnie, bez wyraźnych dysproporcji między poszczególnymi partiami.</li></ul><p>W efekcie Yulia osiągnęła formę, która w pełni ją satysfakcjonuje: bez ekstremalnej rzeźby, ale z dużą ilością masy mięśniowej, dobrymi proporcjami i wyraźnie sportowym wyglądem.</p><p class=\"case-note\">Dalej głównie utrzymywaliśmy tę formę i kontynuowaliśmy progres w treningach.</p>"}
  
  },

  valentina:{
    img:ASSET+'case-valentina.webp',
    reviewImg:null,
    extraImgs:[ASSET+'case-valentina-2.webp'],
    uk:{title:'ЗНИЖЕННЯ ВАГИ ТА РЕКОМПОЗИЦІЯ ТІЛА ЗА 3 МІСЯЦІ',meta:'Valentina · -8 кг · без досвіду тренувань',reviewLabel:'',text:"<h4>З чим прийшла</h4><p>Valentina прийшла з метою схуднути, підтягнути фігуру і почуватись краще. До цього в зал майже не ходила — тільки починала свій шлях у силових тренуваннях. Серйозних обмежень по здоров'ю не було.</p><h4>Що робили</h4><ul><li>Склали індивідуальну програму тренувань.</li><li>Підібрали комфортний раціон на близько 2000 ккал — без жорстких обмежень.</li><li>Поступово вибудували звички, щоб тримати режим тренувань і харчування було легко, без зайвого стресу.</li></ul><h4>Результат</h4><ul><li>За 3 місяці вага пішла приблизно на 8 кг.</li><li>Відсоток жиру помітно знизився.</li><li>При цьому м'язову масу не втратила — навіть трохи набрала, і тіло стало помітно більш підтягнутим і спортивним.</li><li>Пропорції фігури і якість тіла в цілому сильно покращились.</li></ul><p class=\"case-note\">Цей кейс добре показує: навіть без досвіду тренувань можна досягти серйозних змін за короткий термін. Без жорстких дієт і крайнощів — просто грамотні тренування, комфортне харчування і регулярність.</p>"},
    en:{title:'WEIGHT LOSS AND BODY RECOMPOSITION IN 3 MONTHS',meta:'Valentina · -8 kg · no prior training experience',reviewLabel:'',text:"<h4>Where she started</h4><p>Valentina came to me wanting to lose weight, tone up and feel better. Before that she'd barely set foot in a gym — she was just starting out with strength training. No major health restrictions.</p><h4>What we did</h4><ul><li>Built an individual training program.</li><li>Set up a comfortable diet around 2000 kcal — no harsh restrictions.</li><li>Gradually built habits that made it easy to keep up training and nutrition without extra stress.</li></ul><h4>Result</h4><ul><li>Weight dropped by about 8 kg in 3 months.</li><li>Body fat noticeably decreased.</li><li>She didn't lose muscle in the process — actually gained a bit, and her body became noticeably more toned and athletic.</li><li>Body proportions and overall quality improved a lot.</li></ul><p class=\"case-note\">This case shows it well: even with zero training experience, you can get serious results in a short time. No harsh diets, no extremes — just well-built training, comfortable nutrition and consistency.</p>"},
    ru:{title:'СНИЖЕНИЕ ВЕСА И РЕКОМПОЗИЦИЯ ТЕЛА ЗА 3 МЕСЯЦА',meta:'Valentina · -8 кг · без опыта тренировок',reviewLabel:'',text:'<h4>С чем пришла</h4><p>Валентина пришла с целью похудеть, подтянуть фигуру и почувствовать себя лучше. До этого в зал почти не ходила — только начинала свой путь в силовых тренировках. Серьёзных ограничений по здоровью не было.</p><h4>Что делали</h4><ul><li>Составили индивидуальную программу тренировок.</li><li>Подобрали комфортный рацион на около 2000 ккал — без жёстких ограничений.</li><li>Постепенно выстроили привычки, чтобы держать режим тренировок и питания было легко, без лишнего стресса.</li></ul><h4>Результат</h4><ul><li>За 3 месяца вес ушёл примерно на 8 кг.</li><li>Процент жира заметно снизился.</li><li>При этом мышечную массу не потеряла — даже немного набрала, и тело стало заметно более подтянутым и спортивным.</li><li>Пропорции фигуры и качество тела в целом сильно улучшились.</li></ul><p class="case-note">Этот кейс хорошо показывает: даже без опыта тренировок можно добиться серьёзных изменений за короткий срок. Без жёстких диет и крайностей — просто грамотные тренировки, комфортное питание и регулярность.</p>'},
    pl:{title:'REDUKCJA WAGI I REKOMPOZYCJA CIAŁA W 3 MIESIĄCE',meta:'Valentina · -8 kg · bez doświadczenia treningowego',reviewLabel:'',text:"<h4>Z czym przyszła</h4><p>Valentina przyszła z celem zrzucenia wagi, wymodelowania sylwetki i lepszego samopoczucia. Wcześniej praktycznie nie bywała na siłowni — dopiero zaczynała swoją drogę z treningiem siłowym. Bez poważniejszych ograniczeń zdrowotnych.</p><h4>Co zrobiliśmy</h4><ul><li>Ułożyliśmy indywidualny program treningowy.</li><li>Dobraliśmy komfortowy jadłospis na około 2000 kcal — bez surowych ograniczeń.</li><li>Stopniowo zbudowaliśmy nawyki, dzięki którym utrzymanie reżimu treningowego i żywieniowego było łatwe, bez zbędnego stresu.</li></ul><h4>Rezultat</h4><ul><li>W 3 miesiące waga spadła o około 8 kg.</li><li>Poziom tkanki tłuszczowej wyraźnie się zmniejszył.</li><li>Przy tym nie straciła masy mięśniowej — nawet trochę zyskała, a sylwetka stała się wyraźnie bardziej jędrna i sportowa.</li><li>Proporcje sylwetki i ogólna jakość ciała mocno się poprawiły.</li></ul><p class=\"case-note\">Ten przypadek dobrze pokazuje: nawet bez doświadczenia treningowego można osiągnąć poważne zmiany w krótkim czasie. Bez surowych diet i skrajności — po prostu dobrze dobrany trening, komfortowe żywienie i regularność.</p>"}
  },

  inna:{
    img:ASSET+'case-inna.webp',
    reviewImg:null,
    uk:{title:'ЗНИЖЕННЯ ВАГИ ТА РОБОТА З ЕМОЦІЙНИМ ПЕРЕЇДАННЯМ',meta:'Inna · Гіпотиреоз · СДУГ · без жорстких обмежень',reviewLabel:'',text:"<h4>З чим прийшла</h4><p>Inna прийшла з метою в цілому краще почуватись і покращити якість тіла. Схуднення не було головним завданням — через емоційне переїдання жорсткі обмеження тільки додали б стресу. Плюс гіпотиреоз, СДУГ (через нього складніше давалась техніка вправ) і періодичні проблеми зі здоров'ям, які теж треба було враховувати.</p><h4>Що робили</h4><ul><li>Склали індивідуальну програму.</li><li>Поступово поставили техніку — без поспіху.</li><li>Підібрали комфортне харчування, без жорстких обмежень.</li><li>Весь процес підлаштували під її здоров'я і емоційний стан.</li></ul><h4>Результат</h4><ul><li>Тіло стало помітно підтягнутіше — жиру менше, м'язів більше.</li><li>Вага пішла вниз поступово і стабільно.</li><li>Самопочуття і енергія помітно покращились.</li><li>Освоїла техніку і вийшла на хороший силовий рівень.</li><li>Тренування стали просто комфортною частиною життя, а не боротьбою.</li></ul><p class=\"case-note\">Головний результат тут — не лише фігура, а те, що вдалося вибудувати систему тренувань без жорстких обмежень. Саме це дало стабільний прогрес, покращило самопочуття і зберегло мотивацію займатись далі.</p>"},
    en:{title:'WEIGHT LOSS AND WORKING WITH EMOTIONAL OVEREATING',meta:'Inna · Hypothyroidism · ADHD · no harsh restrictions',reviewLabel:'',text:"<h4>Where she started</h4><p>Inna came to me wanting to feel better overall and improve her body quality. Weight loss wasn't the main goal — with emotional overeating, strict restrictions would have just added more stress. On top of that: hypothyroidism, ADHD (which made learning exercise technique harder), and occasional health issues that also had to be factored in.</p><h4>What we did</h4><ul><li>Built an individual program.</li><li>Gradually built her technique — no rushing.</li><li>Set up comfortable nutrition, no harsh restrictions.</li><li>Adapted the whole process to her health and emotional state.</li></ul><h4>Result</h4><ul><li>Her body became noticeably more toned — less fat, more muscle.</li><li>Weight came down gradually and steadily.</li><li>Wellbeing and energy improved noticeably.</li><li>She learned proper technique and reached a solid strength level.</li><li>Training became a comfortable part of life, not a battle.</li></ul><p class=\"case-note\">The real result here isn't just her physique — it's that we built a training system without harsh restrictions. That's exactly what gave her steady progress, better wellbeing, and kept her motivated to keep going.</p>"},
    ru:{title:'СНИЖЕНИЕ ВЕСА И РАБОТА С ЭМОЦИОНАЛЬНЫМ ПЕРЕЕДАНИЕМ',meta:'Inna · Гипотиреоз · СДВГ · без жёстких ограничений',reviewLabel:'',text:'<h4>С чем пришла</h4><p>Инна пришла с целью в целом лучше себя чувствовать и улучшить качество тела. Похудение не было главной задачей — из-за эмоционального переедания жёсткие ограничения только добавили бы стресса. Плюс гипотиреоз, СДВГ (из-за него сложнее давалась техника упражнений) и периодические проблемы со здоровьем, которые тоже нужно было учитывать.</p><h4>Что делали</h4><ul><li>Составили индивидуальную программу.</li><li>Постепенно поставили технику — без спешки.</li><li>Подобрали комфортное питание, без жёстких ограничений.</li><li>Весь процесс подстроили под её здоровье и эмоциональное состояние.</li></ul><h4>Результат</h4><ul><li>Тело стало заметно подтянутее — жира меньше, мышц больше.</li><li>Вес пошёл вниз постепенно и стабильно.</li><li>Самочувствие и энергия заметно улучшились.</li><li>Освоила технику и вышла на хороший силовой уровень.</li><li>Тренировки стали просто комфортной частью жизни, а не борьбой.</li></ul><p class="case-note">Главный результат тут не только фигура, а то, что получилось выстроить систему тренировок без жёстких ограничений. Именно это дало стабильный прогресс, улучшило самочувствие и сохранило мотивацию заниматься дальше.</p>'},
    pl:{title:'REDUKCJA WAGI I PRACA Z JEDZENIEM EMOCJONALNYM',meta:'Inna · Niedoczynność tarczycy · ADHD · bez surowych ograniczeń',reviewLabel:'',text:"<h4>Z czym przyszła</h4><p>Inna przyszła z celem ogólnie lepszego samopoczucia i poprawy jakości ciała. Redukcja wagi nie była głównym zadaniem — przy jedzeniu emocjonalnym surowe ograniczenia tylko dodałyby stresu. Do tego niedoczynność tarczycy, ADHD (przez co trudniej szła technika ćwiczeń) i okresowe problemy zdrowotne, które też trzeba było uwzględnić.</p><h4>Co zrobiliśmy</h4><ul><li>Ułożyliśmy indywidualny program.</li><li>Stopniowo, bez pośpiechu, wypracowaliśmy technikę.</li><li>Dobraliśmy komfortowe żywienie, bez surowych ograniczeń.</li><li>Cały proces dostosowaliśmy do jej zdrowia i stanu emocjonalnego.</li></ul><h4>Rezultat</h4><ul><li>Ciało stało się wyraźnie bardziej jędrne — mniej tłuszczu, więcej mięśni.</li><li>Waga spadała stopniowo i stabilnie.</li><li>Samopoczucie i energia wyraźnie się poprawiły.</li><li>Opanowała technikę i osiągnęła dobry poziom siłowy.</li><li>Trening stał się po prostu komfortową częścią życia, a nie walką.</li></ul><p class=\"case-note\">Głównym rezultatem nie jest tu tylko sylwetka, ale to, że udało się zbudować system treningowy bez surowych ograniczeń. To właśnie dało stabilny postęp, poprawiło samopoczucie i utrzymało motywację do dalszych treningów.</p>"}
  },
  maks:{
    img:ASSET+'case-maks-v2.webp',
    reviewImg:null,
    uk:{title:'ПРИБРАЛИ М\'ЯЗОВІ ЗАТИСКИ І ВИЙШЛИ НА СТАБІЛЬНИЙ НАБІР МАСИ',meta:'Maks · Затиснутий грудний м\'яз · Напруга стегон',reviewLabel:'',text:'<h4>Вихідна ситуація</h4><p>Макс звернувся до мене з метою набрати м\'язову масу. Але вже на перших тренуваннях стало зрозуміло, що спочатку потрібно вирішити іншу проблему.</p><ul><li>сильно затиснутий правий грудний м\'яз;</li><li>сильна напруга м\'язів передньої поверхні стегна;</li><li>через це було важко виконувати навіть звичайні присідання з невеликою вагою.</li></ul><h4>Що було зроблено</h4><p>Ми додали в програму вправи на розтяжку, самомасаж і роботу з MFR-роликом та масажним пістолетом. Я показав, як самостійно опрацьовувати затиснуті м\'язи вдома. Один раз Макс також відвідав масажиста, щоб точніше визначити проблемні зони, а далі ми вже повністю працювали за нашим планом.</p><h4>Результат</h4><ul><li>За кілька місяців повністю прибрали м\'язові затиски.</li><li>Відновили нормальну рухливість.</li><li>Тренування стали комфортними.</li><li>Макс зміг повноцінно прогресувати в залі і набрав хорошу кількість м\'язової маси.</li></ul><p class="case-note">Наочний приклад того, що перед набором маси іноді важливіше спочатку розібратися з рухливістю і затисками — без цього прогрес просто впирається у стелю.</p>'},
    en:{title:'RELEASED MUSCLE TENSION AND MOVED INTO STEADY MASS GAIN',meta:'Maks · Tight chest muscle · Tense thighs',reviewLabel:'',text:'<h4>Starting point</h4><p>Maks came to me with the goal of gaining muscle mass. But by the first few sessions it became clear we first had to deal with a different problem.</p><ul><li>his right chest muscle was significantly tight;</li><li>strong tension in the front thigh muscles;</li><li>this made even a basic bodyweight squat difficult.</li></ul><h4>What we did</h4><p>We added stretching, self-massage and work with an MFR roller and a massage gun to the program. I showed him how to release tight muscles on his own at home. Maks also visited a massage therapist once to pinpoint the problem areas more precisely, and from there we worked fully according to our own plan.</p><h4>Result</h4><ul><li>Within a few months the muscle tension was fully released.</li><li>Normal mobility was restored.</li><li>Training became comfortable.</li><li>Maks was then able to progress properly in the gym and gained a solid amount of muscle mass.</li></ul><p class="case-note">A clear example of how, before chasing mass, it\'s sometimes more important to first sort out mobility and tension — without that, progress simply hits a ceiling.</p>'},
    ru:{title:'УСТРАНИЛИ МЫШЕЧНЫЕ ЗАЖИМЫ И ВЫШЛИ НА СТАБИЛЬНЫЙ НАБОР МАССЫ',meta:'Maks · Зажатая грудная мышца · Напряжение бёдер',reviewLabel:'',text:'<h4>Исходная ситуация</h4><p>Макс обратился ко мне с целью набрать мышечную массу. Но уже на первых тренировках стало понятно, что сначала нужно решить другую проблему.</p><ul><li>сильно зажата правая грудная мышца;</li><li>сильное напряжение мышц передней поверхности бедра;</li><li>из-за этого было тяжело выполнять даже обычные приседания с небольшим весом.</li></ul><h4>Что было сделано</h4><p>Мы добавили в программу упражнения на растяжку, самомассаж и работу с MFR-роллом и массажным пистолетом. Я показал, как самостоятельно прорабатывать зажатые мышцы дома. Один раз Макс также посетил массажиста, чтобы точнее определить проблемные зоны, а дальше мы уже полностью работали по нашему плану.</p><h4>Результат</h4><ul><li>За несколько месяцев полностью убрали мышечные зажимы.</li><li>Восстановили нормальную подвижность.</li><li>Тренировки стали комфортными.</li><li>Макс смог полноценно прогрессировать в зале и набрал хорошее количество мышечной массы.</li></ul><p class="case-note">Наглядный пример того, что перед набором массы иногда важнее сначала разобраться с подвижностью и зажимами — без этого прогресс просто упирается в потолок.</p>'},
    pl:{title:'USUNĘLIŚMY NAPIĘCIA MIĘŚNIOWE I PRZESZLIŚMY DO STABILNEGO BUDOWANIA MASY',meta:'Maks · Napięty mięsień piersiowy · Napięcie ud',reviewLabel:'',text:'<h4>Sytuacja wyjściowa</h4><p>Maks zgłosił się do mnie z celem zbudowania masy mięśniowej. Już na pierwszych treningach stało się jednak jasne, że najpierw trzeba rozwiązać inny problem.</p><ul><li>mocno napięty prawy mięsień piersiowy;</li><li>silne napięcie mięśni przedniej części uda;</li><li>przez to trudno mu było wykonać nawet zwykłe przysiady z niewielkim obciążeniem.</li></ul><h4>Co zostało zrobione</h4><p>Dodaliśmy do programu ćwiczenia rozciągające, automasaż oraz pracę z rolką MFR i pistoletem do masażu. Pokazałem mu, jak samodzielnie rozluźniać napięte mięśnie w domu. Maks odwiedził też raz masażystę, aby dokładniej określić problematyczne miejsca, a dalej pracowaliśmy już w pełni według naszego planu.</p><h4>Rezultat</h4><ul><li>W ciągu kilku miesięcy całkowicie usunęliśmy napięcia mięśniowe.</li><li>Przywróciliśmy normalną ruchomość.</li><li>Treningi stały się komfortowe.</li><li>Maks mógł w pełni progresować na siłowni i zbudował solidną ilość masy mięśniowej.</li></ul><p class="case-note">Wyraźny przykład tego, że przed budowaniem masy czasem ważniejsze jest najpierw uporanie się z ruchomością i napięciami — bez tego progres po prostu napotyka sufit.</p>'}
  },

  kostiak:{
    img:ASSET+'case-kostiak-review.webp',
    reviewImg:null,
    uk:{title:'ПОБУДОВА АТЛЕТИЧНОЇ ФІГУРИ ПРИ ХВОРОБІ ПЕРТЕСА КУЛЬШОВОГО СУГЛОБА',meta:'Костя K. · 10 тренувань · Набір м\'язової маси · Безпечна робота з обмеженнями',reviewLabel:'Справжній відгук клієнта',text:"<h4>З чим прийшов</h4><p>Костя прийшов до мене з простою метою — набрати м'язову масу і зробити фігуру більш спортивною та атлетичною.</p><p>Але звичайний підхід тут не підходив. У нього була хвороба Пертеса правого кульшового суглоба, укорочення правої ноги приблизно на 1,5 см та нестабільність кульшового суглоба. Він також використовував ортопедичні устілки.</p><p>Біг, стрибки та важке осьове навантаження, включно з важкими присіданнями зі штангою, були протипоказані.</p><p>Додатково у Кості були невеликі складнощі з координацією та концентрацією, тому постановка техніки деяких вправ давалася йому складніше.</p><h4>Що було зроблено</h4><p>За 10 тренувань ми повністю вибудували його тренувальний процес.</p><ul><li>Підібрали вправи, у яких кульшовий суглоб максимально стабільний і при цьому відсутній дискомфорт.</li><li>Зробили акцент на зміцненні м'язів, які допомагають стабілізувати кульшовий суглоб — перш за все сідничних.</li><li>Поставили техніку виконання вправ і навчили контролювати рухи.</li><li>Налаштували тренувальну програму та харчування.</li><li>Навчили самостійно регулювати навантаження і стежити за своїм станом під час тренувань.</li></ul><h4>Результат</h4><p>Всього за 10 тренувань Костя навчився повноцінно тренуватися самостійно.</p><p>Дискомфорт при навантаженнях став значно меншим, покращились контроль рухів і техніка виконання вправ.</p><p>При цьому він помітно змінився візуально: набрав м'язову масу, трохи знизив кількість жирової тканини і став виглядати значно більш спортивно та атлетично.</p><p>Після завершення нашої спільної роботи Костя вже кілька місяців тренується самостійно за складеною мною програмою, продовжує прогресувати і відзначає, що тренування проходять комфортно.</p><h4>Головний результат</h4><p>Завдання полягало не просто в наборі м'язової маси. Потрібно було побудувати повноцінний тренувальний процес навколо наявного захворювання й обмежень, не створюючи зайвого ризику для кульшового суглоба.</p><p class=\"case-note\">І за 10 тренувань ми не тільки отримали помітні зміни у формі, але й зробили так, щоб Костя міг далі самостійно і безпечно тренуватися та продовжувати прогресувати.</p>"},
    en:{title:'BUILDING AN ATHLETIC PHYSIQUE WITH PERTHES DISEASE OF THE HIP',meta:'Kostia K. · 10 sessions · Muscle mass gain · Safely working with limitations',reviewLabel:'Real client review',text:"<h4>Where he started</h4><p>Kostia came to me with a simple goal — build muscle mass and make his physique more athletic.</p><p>A standard approach wouldn't work here though. He had Perthes disease of the right hip, a roughly 1.5 cm shortening of the right leg, and hip joint instability. He also used orthopedic insoles.</p><p>Running, jumping and heavy axial load, including heavy barbell squats, were contraindicated.</p><p>On top of that, Kostia had some difficulty with coordination and concentration, which made learning the technique for some exercises harder for him.</p><h4>What we did</h4><p>Over 10 sessions we fully built out his training process.</p><ul><li>Selected exercises where the hip joint stays maximally stable with no discomfort.</li><li>Focused on strengthening the muscles that help stabilize the hip joint — primarily the glutes.</li><li>Set proper exercise technique and taught him to control his movements.</li><li>Fine-tuned the training program and nutrition.</li><li>Taught him to adjust the load himself and monitor how he feels during training.</li></ul><h4>Result</h4><p>In just 10 sessions, Kostia learned to train fully on his own.</p><p>Discomfort under load dropped significantly, and his movement control and exercise technique improved.</p><p>He also changed visibly: gained muscle mass, slightly reduced body fat, and started looking noticeably more athletic.</p><p>After we finished working together, Kostia has been training on his own for several months now, following the program I built, continuing to progress, and says the training feels comfortable.</p><h4>Main result</h4><p>The task wasn't just to build muscle mass. We had to build a full training process around an existing condition and its limitations, without creating extra risk for the hip joint.</p><p class=\"case-note\">In 10 sessions we got noticeable changes in his physique — and made sure Kostia could keep training on his own, safely, and keep progressing.</p>"},
    ru:{title:'НАБОР МЫШЕЧНОЙ МАССЫ ПРИ БОЛЕЗНИ ПЕРТЕСА ТАЗОБЕДРЕННОГО СУСТАВА',meta:'Kostia K. · 10 тренировок · Набор мышечной массы · Безопасная работа с ограничениями',reviewLabel:'Реальный отзыв клиента',text:"<h4>С чем пришёл</h4><p>Костя пришёл ко мне с простой целью — набрать мышечную массу и сделать фигуру более спортивной и атлетичной.</p><p>Но обычный подход здесь не подходил. У него была болезнь Пертеса правого тазобедренного сустава, укорочение правой ноги примерно на 1,5 см и нестабильность тазобедренного сустава. Он также использовал ортопедические стельки.</p><p>Бег, прыжки и тяжёлая осевая нагрузка, включая тяжёлые приседания со штангой, были противопоказаны.</p><p>Дополнительно у Кости были небольшие сложности с координацией и концентрацией, поэтому постановка техники некоторых упражнений давалась ему сложнее.</p><h4>Что было сделано</h4><p>За 10 тренировок мы полностью выстроили его тренировочный процесс.</p><ul><li>Подобрали упражнения, в которых тазобедренный сустав максимально стабилен и при этом отсутствует дискомфорт.</li><li>Сделали акцент на укреплении мышц, которые помогают стабилизировать тазобедренный сустав — прежде всего ягодичных.</li><li>Поставили технику выполнения упражнений и научили контролировать движения.</li><li>Настроили тренировочную программу и питание.</li><li>Научили самостоятельно регулировать нагрузку и следить за своим состоянием во время тренировок.</li></ul><h4>Результат</h4><p>Всего за 10 тренировок Костя научился полноценно тренироваться самостоятельно.</p><p>Дискомфорт при нагрузках стал значительно меньше, улучшились контроль движений и техника выполнения упражнений.</p><p>При этом он заметно изменился визуально: набрал мышечную массу, немного снизил количество жировой ткани и стал выглядеть значительно более спортивно и атлетично.</p><p>После завершения нашей совместной работы Костя уже несколько месяцев тренируется самостоятельно по составленной мной программе, продолжает прогрессировать и отмечает, что тренировки проходят комфортно.</p><h4>Главный результат</h4><p>Задача была не просто набрать мышечную массу. Нужно было построить полноценный тренировочный процесс вокруг существующего заболевания и ограничений, не создавая лишнего риска для тазобедренного сустава.</p><p class=\"case-note\">И за 10 тренировок мы не только получили заметные изменения в форме, но и сделали так, чтобы Костя дальше мог самостоятельно и безопасно тренироваться и продолжать прогрессировать.</p>"},
    pl:{title:'BUDOWA ATLETYCZNEJ SYLWETKI PRZY CHOROBIE PERTHESA STAWU BIODROWEGO',meta:'Kostia K. · 10 treningów · Budowa masy mięśniowej · Bezpieczna praca z ograniczeniami',reviewLabel:'Prawdziwa opinia klienta',text:"<h4>Z czym przyszedł</h4><p>Kostia zgłosił się do mnie z prostym celem — zbudować masę mięśniową i uczynić sylwetkę bardziej sportową i atletyczną.</p><p>Standardowe podejście się tu jednak nie sprawdzało. Miał chorobę Perthesa prawego stawu biodrowego, skrócenie prawej nogi o ok. 1,5 cm oraz niestabilność stawu biodrowego. Nosił też wkładki ortopedyczne.</p><p>Bieganie, skoki i ciężkie obciążenie osiowe, w tym ciężkie przysiady ze sztangą, były przeciwwskazane.</p><p>Dodatkowo Kostia miał niewielkie trudności z koordynacją i koncentracją, przez co ustawienie techniki niektórych ćwiczeń szło mu trudniej.</p><h4>Co zostało zrobione</h4><p>W ciągu 10 treningów w pełni ułożyliśmy jego proces treningowy.</p><ul><li>Dobraliśmy ćwiczenia, w których staw biodrowy jest maksymalnie stabilny i nie odczuwa dyskomfortu.</li><li>Skupiliśmy się na wzmocnieniu mięśni stabilizujących staw biodrowy — przede wszystkim pośladkowych.</li><li>Ustawiliśmy technikę wykonania ćwiczeń i nauczyliśmy kontrolować ruchy.</li><li>Dopracowaliśmy program treningowy i żywienie.</li><li>Nauczyliśmy samodzielnie regulować obciążenie i obserwować swój stan podczas treningu.</li></ul><h4>Rezultat</h4><p>Już po 10 treningach Kostia nauczył się w pełni trenować samodzielnie.</p><p>Dyskomfort przy obciążeniach znacząco się zmniejszył, poprawiła się kontrola ruchów i technika wykonania ćwiczeń.</p><p>Przy tym wyraźnie zmienił się wizualnie: zbudował masę mięśniową, nieznacznie zmniejszył ilość tkanki tłuszczowej i zaczął wyglądać znacznie bardziej sportowo i atletycznie.</p><p>Po zakończeniu naszej wspólnej pracy Kostia od kilku miesięcy trenuje już samodzielnie według ułożonego przeze mnie programu, dalej progresuje i podkreśla, że treningi przebiegają komfortowo.</p><h4>Główny rezultat</h4><p>Zadaniem nie było tylko zbudowanie masy mięśniowej. Trzeba było zbudować pełnoprawny proces treningowy wokół istniejącej choroby i ograniczeń, nie tworząc dodatkowego ryzyka dla stawu biodrowego.</p><p class=\"case-note\">I w ciągu 10 treningów udało się nie tylko uzyskać zauważalne zmiany sylwetki, ale też sprawić, by Kostia mógł dalej samodzielnie i bezpiecznie trenować i kontynuować progres.</p>"}
  },

  olga:{
    img:ASSET+'case-olga-review.webp',
    reviewImg:null,
    uk:{title:'РЕКОМПОЗИЦІЯ ТІЛА ПРИ МІЖХРЕБЦЕВІЙ ГРИЖІ',meta:'Olga · Рекомпозиція · Міжхребцева грижа · 2 місяці роботи',reviewLabel:'Справжній відгук клієнта',text:"<h4>З чим прийшла</h4><p>Ольга прийшла з метою схуднути, набрати м'язову масу, зробити тіло більш спортивним і навчитися грамотно тренуватися.</p><p>При цьому у неї була поперекова грижа, яка досить часто давала про себе знати і могла викликати дискомфорт та біль. Через це Ольга дуже боялася починати силові тренування і переживала, що навантаження можуть погіршити її стан.</p><p>Я пояснив, як правильно вибудувати силові тренування з урахуванням її стану, щоб вони, навпаки, допомагали покращувати самопочуття і фізичну форму.</p><h4>Що було зроблено</h4><ul><li>Адаптували тренувальну програму під стан поперека.</li><li>Поставили техніку, темп і контроль кожної вправи.</li><li>Поступово збільшували робочі ваги і тренувальне навантаження.</li><li>Зробили основний акцент на силових тренуваннях і зміцненні глибоких м'язів кора.</li><li>Навчив Ольгу самостійно тренуватися і контролювати прогресію навантаження.</li></ul><h4>Результат</h4><p>За 2 місяці роботи:</p><ul><li>≈ −5 кг жирової маси</li><li>≈ +2 кг м'язової маси</li><li>−3 кг загальної ваги</li><li>Дискомфорт у попереку практично перестав турбувати.</li><li>Робоча вага в сідничному містку зросла приблизно з 20–30 до 120 кг.</li></ul><p>При цьому форма сідниць і тіла загалом помітно покращилася — зміни добре видно навіть візуально.</p><p class=\"case-note\">Найголовніше — Ольга не очікувала, що з урахуванням грижі можна настільки швидко і при цьому безпечно прогресувати в силових тренуваннях. Зараз вона повністю задоволена результатом нашої роботи і продовжує тренуватися самостійно.</p>"},
    en:{title:'BODY RECOMPOSITION WITH A HERNIATED LUMBAR DISC',meta:'Olga · Recomposition · Herniated disc · 2 months of work',reviewLabel:'Real client review',text:"<h4>Where she started</h4><p>Olga came to me wanting to lose fat, build muscle, get a more athletic body and learn how to train properly.</p><p>She also had a lumbar disc herniation that flared up fairly often and could cause discomfort and pain. Because of this she was very afraid to start strength training and worried that the load could make her condition worse.</p><p>I explained how to structure strength training correctly around her condition, so that it would actually help improve how she felt and her physical shape, instead of making things worse.</p><h4>What we did</h4><ul><li>Adapted the training program to her lower back condition.</li><li>Set proper technique, tempo and control for every exercise.</li><li>Gradually increased working weights and training load.</li><li>Focused mainly on strength training and strengthening the deep core muscles.</li><li>Taught Olga to train on her own and manage load progression herself.</li></ul><h4>Result</h4><p>In 2 months of working together:</p><ul><li>≈ −5 kg of fat mass</li><li>≈ +2 kg of muscle mass</li><li>−3 kg total body weight</li><li>Lower back discomfort has practically stopped bothering her.</li><li>Working weight on the hip thrust went from around 20–30 kg up to 120 kg.</li></ul><p>The shape of her glutes and body overall improved noticeably — the changes are clearly visible even at a glance.</p><p class=\"case-note\">The main thing — Olga didn't expect that, even with a herniated disc, she could progress in strength training this fast and this safely. She's now fully happy with the results and keeps training on her own.</p>"},
    ru:{title:'РЕКОМПОЗИЦИЯ ТЕЛА ПРИ МЕЖПОЗВОНОЧНОЙ ГРЫЖЕ',meta:'Olga · Рекомпозиция · Межпозвоночная грыжа · 2 месяца работы',reviewLabel:'Реальный отзыв клиента',text:"<h4>С чем пришла</h4><p>Ольга пришла с целью похудеть, набрать мышечную массу, сделать тело более спортивным и научиться грамотно тренироваться.</p><p>При этом у неё была поясничная грыжа, которая достаточно часто давала о себе знать и могла вызывать дискомфорт и боль. Из-за этого Ольга очень сильно боялась начинать силовые тренировки и переживала, что нагрузки могут ухудшить её состояние.</p><p>Я объяснил, как правильно выстроить силовые тренировки с учётом её состояния, чтобы они, наоборот, помогали улучшать самочувствие и физическую форму.</p><h4>Что было сделано</h4><ul><li>Адаптировали тренировочную программу под состояние поясницы.</li><li>Поставили технику, темп и контроль каждого упражнения.</li><li>Постепенно увеличивали рабочие веса и тренировочную нагрузку.</li><li>Сделали основной акцент на силовых тренировках и укреплении глубоких мышц кора.</li><li>Научил Ольгу самостоятельно тренироваться и контролировать прогрессию нагрузки.</li></ul><h4>Результат</h4><p>За 2 месяца работы:</p><ul><li>≈ −5 кг жировой массы</li><li>≈ +2 кг мышечной массы</li><li>−3 кг общего веса</li><li>Дискомфорт в пояснице практически перестал беспокоить.</li><li>Рабочий вес в ягодичном мостике вырос примерно с 20–30 до 120 кг.</li></ul><p>При этом форма ягодиц и тела в целом заметно улучшилась — изменения хорошо видны даже визуально.</p><p class=\"case-note\">Самое главное — Ольга не ожидала, что с учётом грыжи можно настолько быстро и при этом безопасно прогрессировать в силовых тренировках. Сейчас она полностью довольна результатом нашей работы и продолжает тренироваться самостоятельно.</p>"},
    pl:{title:'REKOMPOZYCJA SYLWETKI PRZY PRZEPUKLINIE MIĘDZYKRĘGOWEJ',meta:'Olga · Rekompozycja · Przepuklina międzykręgowa · 2 miesiące pracy',reviewLabel:'Prawdziwa opinia klienta',text:"<h4>Z czym przyszła</h4><p>Olga przyszła z celem schudnąć, zbudować masę mięśniową, uczynić ciało bardziej sportowym i nauczyć się trenować w dobrym stylu.</p><p>Miała przy tym przepuklinę odcinka lędźwiowego, która dość często dawała o sobie znać i mogła powodować dyskomfort oraz ból. Przez to bardzo obawiała się zaczynać treningi siłowe i martwiła się, że obciążenia mogą pogorszyć jej stan.</p><p>Wytłumaczyłem, jak poprawnie ułożyć treningi siłowe z uwzględnieniem jej stanu, tak aby wręcz pomagały poprawić samopoczucie i formę fizyczną.</p><h4>Co zostało zrobione</h4><ul><li>Dostosowaliśmy program treningowy do stanu odcinka lędźwiowego.</li><li>Ustawiliśmy technikę, tempo i kontrolę każdego ćwiczenia.</li><li>Stopniowo zwiększaliśmy ciężary robocze i obciążenie treningowe.</li><li>Skupiliśmy się przede wszystkim na treningu siłowym i wzmacnianiu głębokich mięśni core.</li><li>Nauczyłem Olgę samodzielnie trenować i kontrolować progresję obciążenia.</li></ul><h4>Rezultat</h4><p>W ciągu 2 miesięcy pracy:</p><ul><li>ok. −5 kg tkanki tłuszczowej</li><li>ok. +2 kg masy mięśniowej</li><li>−3 kg wagi całkowitej</li><li>Dyskomfort w odcinku lędźwiowym praktycznie przestał dokuczać.</li><li>Ciężar roboczy w hip thrust wzrósł z ok. 20–30 kg do 120 kg.</li></ul><p>Przy tym kształt pośladków i sylwetki jako całości zauważalnie się poprawił — zmiany widać wyraźnie nawet gołym okiem.</p><p class=\"case-note\">Najważniejsze — Olga nie spodziewała się, że mimo przepukliny da się progresować w treningu siłowym tak szybko i jednocześnie bezpiecznie. Obecnie jest w pełni zadowolona z efektów naszej pracy i kontynuuje treningi samodzielnie.</p>"}
  }
};

function openCase(id) {
  var c = cases[id]; var d = c[currentLang];
  var review = c.reviewImg ? '<div class="case-review"><div class="case-review-label">'+d.reviewLabel+'</div><img src="'+c.reviewImg+'" alt="'+d.reviewLabel+'" loading="lazy"></div>' : '';
  var extra = '';
  if (c.extraImgs && c.extraImgs.length) {
    extra = '<div class="case-extra-label">Додаткові фото / Additional photos</div><div class="case-extra-imgs">' + c.extraImgs.map(function(src){ return '<img src="'+src+'" alt="" loading="lazy" onclick="openLightbox(\''+src+'\',event)">'; }).join('') + '</div>';
  }
  document.getElementById('case-modal-body').innerHTML =
    '<img class="case-modal-img" src="'+c.img+'" alt="'+d.title+'">'+
    '<div class="case-modal-title">'+d.title+'</div>'+
    '<div class="case-modal-meta">'+d.meta+'</div>'+
    '<div class="case-modal-text">'+d.text+'</div>'+review+extra;
  document.getElementById('caseModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeCaseModal() { document.getElementById('caseModal').classList.remove('open'); document.body.style.overflow=''; }

var conditions = {
  spine:{
    uk:{title:'🦴 Хребет',items:['Лордоз','Кіфоз','Сколіоз','Міжхребцеві грижі','Протрузії','Спондилолістез','Хронічний біль у спині'],note:'Підбираю вправи таким чином, щоб тренування були максимально безпечними та не провокували загострення.'},
    en:{title:'🦴 Spine',items:['Lordosis','Kyphosis','Scoliosis','Spinal disc herniations','Disc protrusions','Spondylolisthesis','Chronic back pain'],note:'I select exercises so that training is as safe as possible and doesn\'t provoke flare-ups.'},
    ru:{title:'🦴 Позвоночник',items:['Лордоз','Кифоз','Сколиоз','Межпозвоночные грыжи','Протрузии','Спондилолистез','Хроническая боль в спине'],note:'Подбираю упражнения так, чтобы тренировки были максимально безопасными и не провоцировали обострение.'},
    pl:{title:'🦴 Kręgosłup',items:['Lordoza','Kifoza','Skolioza','Przepukliny międzykręgowe','Protruzje','Kręgozmyk','Przewlekły ból pleców'],note:'Dobieram ćwiczenia tak, by trening był maksymalnie bezpieczny i nie prowokował zaostrzeń.'}
  },
  heart:{
    uk:{title:'❤️ Серце та судини',items:['Артеріальна гіпертонія','Тахікардія','Аритмії','Порушення ліпідного профілю (підвищений холестерин, ЛПНЩ, тригліцериди)','Інші стани, які потребують адаптації фізичного навантаження'],note:''},
    en:{title:'❤️ Heart & vessels',items:['Arterial hypertension','Tachycardia','Arrhythmias','Lipid profile disorders (elevated cholesterol, LDL, triglycerides)','Other conditions requiring adapted training loads'],note:''},
    ru:{title:'❤️ Сердце и сосуды',items:['Артериальная гипертония','Тахикардия','Аритмии','Нарушения липидного профиля (повышенный холестерин, ЛПНП, триглицериды)','Другие состояния, требующие адаптации физической нагрузки'],note:''},
    pl:{title:'❤️ Serce i naczynia',items:['Nadciśnienie tętnicze','Tachykardia','Arytmie','Zaburzenia profilu lipidowego (podwyższony cholesterol, LDL, trójglicerydy)','Inne stany wymagające dostosowania obciążenia treningowego'],note:''}
  },
  glucose:{
    uk:{title:'🩸 Вуглеводний обмін',items:['Цукровий діабет I типу','Цукровий діабет II типу','Інсулінорезистентність','Порушення толерантності до глюкози'],note:'Допомагаю грамотно поєднати фізичні навантаження, харчування та контроль рівня глюкози.'},
    en:{title:'🩸 Carbohydrate metabolism',items:['Type 1 diabetes','Type 2 diabetes','Insulin resistance','Impaired glucose tolerance'],note:'I help combine training, nutrition and blood glucose control correctly.'},
    ru:{title:'🩸 Углеводный обмен',items:['Сахарный диабет I типа','Сахарный диабет II типа','Инсулинорезистентность','Нарушение толерантности к глюкозе'],note:'Помогаю грамотно совместить физические нагрузки, питание и контроль уровня глюкозы.'},
    pl:{title:'🩸 Metabolizm węglowodanów',items:['Cukrzyca typu I','Cukrzyca typu II','Insulinooporność','Zaburzenia tolerancji glukozy'],note:'Pomagam prawidłowo połączyć trening, żywienie i kontrolę poziomu glukozy.'}
  },
  thyroid:{
    uk:{title:'🦋 Щитоподібна залоза та гормональний фон',items:['Гіпотиреоз','Гіпертиреоз','СПКЯ (синдром полікістозних яєчників)','Підвищений рівень андрогенів','Інші гормональні порушення, що впливають на самопочуття або склад тіла'],note:''},
    en:{title:'🦋 Thyroid & hormones',items:['Hypothyroidism','Hyperthyroidism','PCOS (polycystic ovary syndrome)','Elevated androgen levels','Other hormonal disorders affecting wellbeing or body composition'],note:''},
    ru:{title:'🦋 Щитовидная железа и гормональный фон',items:['Гипотиреоз','Гипертиреоз','СПКЯ (синдром поликистозных яичников)','Повышенный уровень андрогенов','Другие гормональные нарушения, влияющие на самочувствие или состав тела'],note:''},
    pl:{title:'🦋 Tarczyca i gospodarka hormonalna',items:['Niedoczynność tarczycy','Nadczynność tarczycy','PCOS (zespół policystycznych jajników)','Podwyższony poziom androgenów','Inne zaburzenia hormonalne wpływające na samopoczucie lub skład ciała'],note:''}
  },
  liver:{
    uk:{title:'🫁 Печінка та нирки',items:['Підвищені показники АЛТ','Підвищені показники АСТ','Підвищений ГГТ','Порушення рівня білірубіну','Інші порушення функції печінки','Захворювання нирок','Стан після нефректомії','Регулярний діаліз (за дозволом лікаря)'],note:'У кожному випадку фізичне навантаження адаптується відповідно до стану здоров\'я.'},
    en:{title:'🫁 Liver & kidneys',items:['Elevated ALT','Elevated AST','Elevated GGT','Bilirubin disorders','Other liver function disorders','Kidney disease','Post-nephrectomy state','Regular dialysis (with doctor\'s approval)'],note:'In every case, training load is adapted to the person\'s health status.'},
    ru:{title:'🫁 Печень и почки',items:['Повышенные показатели АЛТ','Повышенные показатели АСТ','Повышенный ГГТ','Нарушения уровня билирубина','Другие нарушения функции печени','Заболевания почек','Состояние после нефрэктомии','Регулярный диализ (с разрешения врача)'],note:'В каждом случае физическая нагрузка адаптируется в соответствии с состоянием здоровья.'},
    pl:{title:'🫁 Wątroba i nerki',items:['Podwyższone ALT','Podwyższone AST','Podwyższone GGTP','Zaburzenia poziomu bilirubiny','Inne zaburzenia funkcji wątroby','Choroby nerek','Stan po nefrektomii','Regularna dializa (za zgodą lekarza)'],note:'W każdym przypadku obciążenie treningowe jest dostosowywane do stanu zdrowia.'}
  },
  vision:{
    uk:{title:'👁️ Зір та координація',items:['Висока короткозорість','Ризик відшарування сітківки','Інші офтальмологічні обмеження','СДУГ','Порушення концентрації уваги','Порушення координації'],note:'Програма тренувань підбирається з урахуванням усіх можливих ризиків.'},
    en:{title:'👁️ Vision & coordination',items:['High myopia','Risk of retinal detachment','Other ophthalmological limitations','ADHD','Attention and concentration disorders','Coordination issues'],note:'The training program is designed with all possible risks in mind.'},
    ru:{title:'👁️ Зрение и координация',items:['Высокая близорукость','Риск отслоения сетчатки','Другие офтальмологические ограничения','СДВГ','Нарушения концентрации внимания','Нарушения координации'],note:'Программа тренировок подбирается с учётом всех возможных рисков.'},
    pl:{title:'👁️ Wzrok i koordynacja',items:['Wysoka krótkowzroczność','Ryzyko odwarstwienia siatkówki','Inne ograniczenia okulistyczne','ADHD','Zaburzenia koncentracji uwagi','Zaburzenia koordynacji'],note:'Program treningowy dobierany jest z uwzględnieniem wszystkich możliwych ryzyk.'}
  },
  joints:{
    uk:{title:'🦵 Суглоби',items:['Артроз','Артрит','Травми менісків','Нестабільність суглобів','Особливості будови кульшового, колінного та інших суглобів','Наслідки спортивних травм'],note:'Навантаження підбирається таким чином, щоб покращувати функцію суглобів без перевантаження.'},
    en:{title:'🦵 Joints',items:['Arthrosis','Arthritis','Meniscus injuries','Joint instability','Structural features of the hip, knee and other joints','Consequences of sports injuries'],note:'The load is selected to improve joint function without overloading it.'},
    ru:{title:'🦵 Суставы',items:['Артроз','Артрит','Травмы менисков','Нестабильность суставов','Особенности строения тазобедренного, коленного и других суставов','Последствия спортивных травм'],note:'Нагрузка подбирается так, чтобы улучшать функцию суставов без перегрузки.'},
    pl:{title:'🦵 Stawy',items:['Artroza','Zapalenie stawów','Urazy łąkotek','Niestabilność stawów','Specyfika budowy stawu biodrowego, kolanowego i innych','Skutki urazów sportowych'],note:'Obciążenie dobierane jest tak, by poprawiać funkcję stawów bez przeciążania.'}
  },
  pregnancy:{
    uk:{title:'🤰 Вагітність та відновлення',items:['Вагітні жінки','Жінки після пологів','Діастаз','Відновлення після кесаревого розтину'],note:'Програми складаються відповідно до терміну вагітності або етапу післяпологового відновлення.'},
    en:{title:'🤰 Pregnancy & recovery',items:['Pregnant women','Postpartum women','Diastasis recti','Recovery after a C-section'],note:'Programs are built according to the stage of pregnancy or postpartum recovery.'},
    ru:{title:'🤰 Беременность и восстановление',items:['Беременные женщины','Женщины после родов','Диастаз','Восстановление после кесарева сечения'],note:'Программы составляются в соответствии со сроком беременности или этапом послеродового восстановления.'},
    pl:{title:'🤰 Ciąża i regeneracja',items:['Kobiety w ciąży','Kobiety po porodzie','Diastaza','Regeneracja po cesarskim cięciu'],note:'Programy są układane odpowiednio do etapu ciąży lub połogu.'}
  }
};
var condWorkWithLabel = {uk:'Працюю з людьми, які мають:',en:'I work with people who have:',ru:'Работаю с людьми, у которых есть:',pl:'Pracuję z osobami, które mają:'};
function openCondition(id) {
  var d = conditions[id][currentLang];
  var li = d.items.map(function(i){return '<li>'+i+'</li>';}).join('');
  document.getElementById('cond-modal-body').innerHTML =
    '<div class="modal-title">'+d.title+'</div>'+
    '<p style="color:rgba(245,240,232,.55);font-size:13px;margin-bottom:14px;">'+condWorkWithLabel[currentLang]+'</p>'+
    '<ul class="modal-list">'+li+'</ul>'+
    (d.note ? '<div class="modal-result">'+d.note+'</div>' : '');
  document.getElementById('condModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeConditionModal() { document.getElementById('condModal').classList.remove('open'); document.body.style.overflow=''; }
function condOverlayClick(e) { if(e.target===document.getElementById('condModal')) closeConditionModal(); }
function openLightbox(src,e){e.stopPropagation();document.getElementById('lightbox-img').src=src;document.getElementById('lightbox').classList.add('open');}
function closeLightbox(){document.getElementById('lightbox').classList.remove('open');document.getElementById('lightbox-img').src='';}
function caseMOverlayClick(e) { if(e.target===document.getElementById('caseModal')) closeCaseModal(); }

// ---- COLLAPSIBLE BLOCKS (mobile: about story / results) ----
function toggleCollapse(wrapId, btnId) {
  var wrap = document.getElementById(wrapId);
  var btn = document.getElementById(btnId);
  if (!wrap || !btn) return;
  var expanded = wrap.classList.toggle('expanded');
  btn.classList.toggle('open', expanded);
  if (!expanded) {
    var rect = wrap.getBoundingClientRect();
    if (rect.top < 0) wrap.scrollIntoView({behavior:'smooth', block:'start'});
  }
}
function setClientsCollapseHeight() {
  var wrap = document.getElementById('clientsCollapse');
  if (!wrap || window.innerWidth > 960) { if(wrap) wrap.style.removeProperty('--collapsed-h'); return; }
  var cards = wrap.querySelectorAll('.client-card');
  if (cards.length <= 6) { wrap.classList.add('expanded'); return; }
  var sixth = cards[5];
  var wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
  var sixthBottom = sixth.getBoundingClientRect().bottom + window.scrollY;
  var h = Math.ceil(sixthBottom - wrapTop) + 16;
  wrap.style.setProperty('max-height', h + 'px');
  var styleTag = document.getElementById('clientsCollapseStyle');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'clientsCollapseStyle';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = '@media(max-width:960px){#clientsCollapse:not(.expanded){max-height:'+h+'px!important;}}';
}
window.addEventListener('load', setClientsCollapseHeight);
window.addEventListener('resize', function(){ clearTimeout(window._ccTimer); window._ccTimer = setTimeout(setClientsCollapseHeight, 200); });

document.addEventListener('keydown', function(e) { if(e.key==='Escape'){closeModal();closeCaseModal();closeConditionModal();closeLightbox();} });

// ---- FORM with Telegram Bot API ----
function submitForm(e) {
  e.preventDefault();
  var btn = document.getElementById('fsubBtn');

  // Anti-spam: honeypot field should always be empty for real users
  var honeypot = document.getElementById('fwebsite').value;
  // Anti-spam: real humans take at least ~2.5s to fill the form
  var loadedAt = parseInt(document.getElementById('fts').value || '0', 10);
  var tooFast = loadedAt && (Date.now() - loadedAt) < 2500;

  if (honeypot || tooFast) {
    // Silently pretend success without actually sending — doesn't tip off bots
    document.getElementById('contactForm').style.display = 'none';
    var s0 = document.getElementById('formSuccess');
    s0.classList.add('show');
    var h0 = s0.querySelector('h3'); var p0 = s0.querySelector('p');
    if (h0) h0.innerHTML = h0.getAttribute('data-'+currentLang) || h0.innerHTML;
    if (p0) p0.innerHTML = p0.getAttribute('data-'+currentLang) || p0.innerHTML;
    return;
  }

  var name = document.getElementById('fname').value;
  var phone = document.getElementById('fphone').value;
  var goal = document.getElementById('fgoal').value;
  var format = document.getElementById('fformat').value;
  var msg = document.getElementById('fmsg').value;

  btn.textContent = '...';
  btn.disabled = true;

  fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name: name,
      contact: phone,
      goal: goal,
      format: format,
      message: msg,
      lang: currentLang,
      website: honeypot,
      elapsed: loadedAt ? (Date.now() - loadedAt) : 0
    })
  })
  .then(function(r){ return r.json(); })
  .then(function(data) {
    if (data.ok) {
      document.getElementById('contactForm').style.display = 'none';
      var s = document.getElementById('formSuccess');
      s.classList.add('show');
      var h = s.querySelector('h3'); var p = s.querySelector('p');
      if(h) h.innerHTML = h.getAttribute('data-'+currentLang) || h.innerHTML;
      if(p) p.innerHTML = p.getAttribute('data-'+currentLang) || p.innerHTML;
      if (window.fbq) { window.fbq('track', 'Lead'); }
      if (window.gtag) { window.gtag('event', 'generate_lead', { form_format: format || '', form_goal: goal || '' }); }
    } else {
      var ERR_MSG = {pl:'⚠ Błąd. Napisz na Telegramie', ru:'⚠ Ошибка. Напиши в Telegram', en:'⚠ Error. Message me on Telegram', uk:'⚠ Помилка. Напиши в Telegram'};
      btn.textContent = ERR_MSG[currentLang] || ERR_MSG.en;
      btn.disabled = false;
    }
  })
  .catch(function() {
    var ERR_MSG2 = {pl:'⚠ Błąd. Napisz na Telegramie', ru:'⚠ Ошибка. Напиши в Telegram', en:'⚠ Error. Message me on Telegram', uk:'⚠ Помилка. Напиши в Telegram'};
    btn.textContent = ERR_MSG2[currentLang] || ERR_MSG2.en;
    btn.disabled = false;
  });
}

// ---- RESULTS PAGE: filters ----
function filterCases(cat, btn) {
  document.querySelectorAll('.case-filter-btn').forEach(function(b){ b.classList.toggle('active', b === btn); });
  document.querySelectorAll('.case-article').forEach(function(a){
    var cats = (a.getAttribute('data-cats') || '').split(' ');
    a.style.display = (cat === 'all' || cats.indexOf(cat) !== -1) ? '' : 'none';
  });
}
// open a case from a #hash link (e.g. /ru/results/#kostia)
window.addEventListener('load', function(){
  var h = (location.hash || '').replace('#', '');
  if (h && document.getElementById('case-' + h)) {
    setTimeout(function(){ document.getElementById('case-' + h).scrollIntoView({behavior:'smooth', block:'start'}); }, 300);
  }
});
