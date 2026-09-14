import { firebaseConfig } from "./firebase-config.js";

(function(){
  "use strict";

  var FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  var FIREBASE_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
  var FIREBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

  /* ---------------- i18n ----------------
     Every user-facing string lives here, keyed by a stable id, with one
     block per language. Nothing in the rest of the file contains literal
     UI text - it all goes through t('some.key'). Menu/option data below
     (MENU/TEMPS/SIZES/MILKS/SUGARS/EXTRAS/STATUS) uses stable ids (e.g.
     'espresso', 'cold', 'oat') as values/keys; only the *label* shown to
     the user is looked up here. That's what lets language switch re-render
     both the live UI and previously-placed orders (which store the id,
     not the label) in whichever language is currently active. */
  var I18N = {
    ru: {
      brandSuffix: 'кофе',
      pageTitle: 'Muffin · Заказ кофе',
      connConnecting: 'подключение…',
      connOnline: 'на связи',
      connOffline: 'нет сети',
      connError: 'ошибка связи',
      installBtn: '⤓ Установить',
      baristaLabelPrefix: 'Бариста: ',
      baristaLogoutBtn: 'Выйти',
      baristaLoginBtn: 'Вход для бариста',
      baristaEmailPrompt: 'Email бариста:',
      baristaPasswordPrompt: 'Пароль:',
      baristaLoginFailedToast: 'Не удалось войти — проверьте email и пароль',
      noConnectionToast: 'Нет связи с сервером',
      employeeIntro: 'Выберите напиток, укажите имя и этаж — заказ сразу увидит бариста в «Muffin». Останется спуститься и оплатить на кассе.',
      newOrderHeading: 'Новый заказ',
      fieldDrink: 'Напиток',
      fieldTemp: 'Температура',
      fieldSize: 'Размер',
      fieldMilk: 'Молоко',
      fieldSugar: 'Сахар',
      fieldExtras: 'Добавки',
      fieldNoteLabel: 'Комментарий (необязательно)',
      notePlaceholder: 'Например: без сахара, погорячее',
      fieldNameLabel: 'Имя',
      namePlaceholder: 'Как к вам обращаться',
      fieldFloorLabel: 'Этаж',
      floorUnit: 'этаж',
      floorAbbrev: 'эт.',
      priceTotalLabel: 'Итого',
      submitBtn: 'Отправить заказ',
      submitBtnBusy: 'Отправляем…',
      myOrdersHeading: 'Мои заказы',
      errNoConnection: 'Нет связи с сервером — заказ пока не может быть отправлен.',
      errNameFloor: 'Укажите имя и этаж, чтобы бариста знал, кому нести заказ.',
      errSubmitFailed: 'Не удалось отправить заказ. Проверьте связь и попробуйте ещё раз.',
      orderSentToast: 'Заказ отправлен · тикет ',
      baristaIntro: 'Заказы из офиса — по мере готовности переводите тикет дальше по статусам.',
      historySummary: 'История (выдано / отменено)',
      histTicket: 'Тикет', histWho: 'Кто', histDrink: 'Напиток', histSum: 'Сумма', histStatus: 'Статус', histTime: 'Время',
      histEmpty: 'Пока пусто',
      colEmpty: 'Пусто',
      cancelTitle: 'Отменить',
      updateStatusFailedToast: 'Не удалось обновить статус',
      cancelFailedToast: 'Не удалось отменить заказ',
      noOrdersYet: 'Пока нет заказов. Оформите первый слева.',
      fillNameFloorNote: 'Укажите имя и этаж слева — здесь появятся статусы ваших заказов.',
      iceTag: 'Айс',
      footerNote: 'Внутренний заказ кофе для офиса · кофейня Muffin',
      offlineBannerTitle: 'Нет связи с сервером.',
      offlineBannerMsg: 'Заказы не отправляются и не обновляются, пока не восстановится соединение — либо ещё не настроен firebase-config.js (см. DEPLOY.md).',
      ordersFetchErrorBanner: 'Проблема при получении заказов с сервера.',
      justNow: 'только что',
      minAbbrev: 'мин',
      hourAbbrev: 'ч',
      themeLabel: {auto:'Тема: авто', light:'Тема: светлая', dark:'Тема: тёмная'},
      langToggleLabel: 'Язык: RU',
      menu: {
        espresso:   {name:'Эспрессо',        desc:'Крепкий, одна порция'},
        americano:  {name:'Американо',       desc:'Эспрессо с горячей водой'},
        cappuccino: {name:'Капучино',        desc:'Классика с молочной пеной'},
        latte:      {name:'Латте',           desc:'Мягкий, больше молока'},
        flatwhite:  {name:'Флэт Уайт',       desc:'Двойной эспрессо, бархатная пена'},
        mocha:      {name:'Мокко',           desc:'Эспрессо, шоколад, молочная пена'},
        raf:        {name:'Раф',             desc:'Взбитые сливки, ваниль'},
        hotchoc:    {name:'Горячий шоколад', desc:'Без кофеина'}
      },
      temps: {hot:'Горячий', cold:'Холодный'},
      milks: {regular:'Обычное', oat:'Овсяное', almond:'Миндальное', lactose_free:'Без лактозы'},
      sugars: {none:'Без сахара', one:'1 ложка', two:'2 ложки'},
      extras: {vanilla:'Ваниль', caramel:'Карамель', hazelnut:'Лесной орех', extra_espresso:'Доп. эспрессо'},
      status: {
        new:       {label:'Новый',     nextLabel:'Принять'},
        accepted:  {label:'Принят',    nextLabel:'Готовить'},
        preparing: {label:'Готовится', nextLabel:'Готово'},
        ready:     {label:'Готов',     nextLabel:'Выдан / оплачен'},
        done:      {label:'Забрали',   nextLabel:null},
        cancelled: {label:'Отменён',   nextLabel:null}
      }
    },
    az: {
      brandSuffix: 'qəhvə',
      pageTitle: 'Muffin · Qəhvə sifarişi',
      connConnecting: 'qoşulur…',
      connOnline: 'əlaqədə',
      connOffline: 'şəbəkə yoxdur',
      connError: 'əlaqə xətası',
      installBtn: '⤓ Quraşdır',
      baristaLabelPrefix: 'Barista: ',
      baristaLogoutBtn: 'Çıxış',
      baristaLoginBtn: 'Barista girişi',
      baristaEmailPrompt: 'Barista email:',
      baristaPasswordPrompt: 'Şifrə:',
      baristaLoginFailedToast: 'Giriş alınmadı — email və şifrəni yoxlayın',
      noConnectionToast: 'Serverlə əlaqə yoxdur',
      employeeIntro: 'İçki seçin, adınızı və mərtəbənizi qeyd edin — sifarişi Muffin baristası dərhal görəcək. Sadəcə aşağı düşüb kassada ödəməlisiniz.',
      newOrderHeading: 'Yeni sifariş',
      fieldDrink: 'İçki',
      fieldTemp: 'Temperatur',
      fieldSize: 'Ölçü',
      fieldMilk: 'Süd',
      fieldSugar: 'Şəkər',
      fieldExtras: 'Əlavələr',
      fieldNoteLabel: 'Şərh (məcburi deyil)',
      notePlaceholder: 'Məsələn: şəkərsiz, daha isti',
      fieldNameLabel: 'Ad',
      namePlaceholder: 'Sizə necə müraciət edək',
      fieldFloorLabel: 'Mərtəbə',
      floorUnit: 'mərtəbə',
      floorAbbrev: 'mərt.',
      priceTotalLabel: 'Cəmi',
      submitBtn: 'Sifarişi göndər',
      submitBtnBusy: 'Göndərilir…',
      myOrdersHeading: 'Sifarişlərim',
      errNoConnection: 'Serverlə əlaqə yoxdur — sifariş hələ göndərilə bilməz.',
      errNameFloor: 'Baristanın sifarişi kimə aparacağını bilməsi üçün ad və mərtəbəni qeyd edin.',
      errSubmitFailed: 'Sifarişi göndərmək mümkün olmadı. Əlaqəni yoxlayıb yenidən cəhd edin.',
      orderSentToast: 'Sifariş göndərildi · bilet ',
      baristaIntro: 'Ofisdən sifarişlər — hazır olduqca bileti növbəti statusa keçirin.',
      historySummary: 'Tarixçə (verilib / ləğv edilib)',
      histTicket: 'Bilet', histWho: 'Kim', histDrink: 'İçki', histSum: 'Məbləğ', histStatus: 'Status', histTime: 'Vaxt',
      histEmpty: 'Hələlik boşdur',
      colEmpty: 'Boşdur',
      cancelTitle: 'Ləğv et',
      updateStatusFailedToast: 'Statusu yeniləmək mümkün olmadı',
      cancelFailedToast: 'Sifarişi ləğv etmək mümkün olmadı',
      noOrdersYet: 'Hələ sifariş yoxdur. Solda ilkini yaradın.',
      fillNameFloorNote: 'Solda ad və mərtəbəni qeyd edin — sifarişlərinizin statusu burada görünəcək.',
      iceTag: 'Buzlu',
      footerNote: 'Ofis üçün daxili qəhvə sifarişi · Muffin qəhvəxanası',
      offlineBannerTitle: 'Serverlə əlaqə yoxdur.',
      offlineBannerMsg: 'Əlaqə bərpa olunana qədər sifarişlər göndərilmir və yenilənmir — ya da firebase-config.js hələ konfiqurasiya edilməyib (bax DEPLOY.md).',
      ordersFetchErrorBanner: 'Serverdən sifarişləri almaqda problem yarandı.',
      justNow: 'indicə',
      minAbbrev: 'dəq',
      hourAbbrev: 'saat',
      themeLabel: {auto:'Tema: avto', light:'Tema: işıqlı', dark:'Tema: qaranlıq'},
      langToggleLabel: 'Dil: AZ',
      menu: {
        espresso:   {name:'Espresso',    desc:'Güclü, bir porsiya'},
        americano:  {name:'Americano',   desc:'Espresso və isti su'},
        cappuccino: {name:'Cappuccino',  desc:'Klassika, süd köpüyü ilə'},
        latte:      {name:'Latte',       desc:'Yumşaq, daha çox süd'},
        flatwhite:  {name:'Flat White',  desc:'İkiqat espresso, məxmər köpük'},
        mocha:      {name:'Mocha',       desc:'Espresso, şokolad, süd köpüyü'},
        raf:        {name:'Raf',         desc:'Çırpılmış qaymaq, vanil'},
        hotchoc:    {name:'İsti şokolad',desc:'Kofeinsiz'}
      },
      temps: {hot:'İsti', cold:'Soyuq'},
      milks: {regular:'Adi', oat:'Yulaf', almond:'Badam', lactose_free:'Laktozsuz'},
      sugars: {none:'Şəkərsiz', one:'1 qaşıq', two:'2 qaşıq'},
      extras: {vanilla:'Vanil', caramel:'Karamel', hazelnut:'Fındıq', extra_espresso:'Əlavə espresso'},
      status: {
        new:       {label:'Yeni',            nextLabel:'Qəbul et'},
        accepted:  {label:'Qəbul edildi',     nextLabel:'Hazırla'},
        preparing: {label:'Hazırlanır',       nextLabel:'Hazır'},
        ready:     {label:'Hazırdır',         nextLabel:'Verildi / ödənildi'},
        done:      {label:'Verildi',          nextLabel:null},
        cancelled: {label:'Ləğv edildi',      nextLabel:null}
      }
    }
  };

  var LANG_CYCLE = ['ru','az'];
  var lang = localStorage.getItem('muffin_lang') || 'ru';
  if(LANG_CYCLE.indexOf(lang) === -1) lang = 'ru';

  function t(key){
    var parts = key.split('.');
    function lookup(dict){
      var obj = dict;
      for(var i=0;i<parts.length;i++){ obj = obj && obj[parts[i]]; if(obj==null) return null; }
      return obj;
    }
    var val = lookup(I18N[lang]);
    if(val == null) val = lookup(I18N.ru); // fallback so a missing key never shows blank
    return val == null ? key : val;
  }

  /* ---------------- menu / option data ----------------
     Stable ids only - never a display string. Labels always come from
     t('menu.<id>.name') etc. so switching language re-renders both the
     live form and any already-placed order using the same id. */
  var MENU = [
    {id:'espresso',   base:2.00},
    {id:'americano',  base:2.50},
    {id:'cappuccino', base:3.50},
    {id:'latte',      base:3.50},
    {id:'flatwhite',  base:3.80},
    {id:'mocha',      base:3.90},
    {id:'raf',        base:4.00},
    {id:'hotchoc',    base:4.20}
  ];
  var TEMPS  = [{id:'hot',delta:0},{id:'cold',delta:0.30}];
  var SIZES  = [{id:'S',delta:0},{id:'M',delta:0.30},{id:'L',delta:0.60}];
  var MILKS  = [{id:'regular',delta:0},{id:'oat',delta:0.40},{id:'almond',delta:0.40},{id:'lactose_free',delta:0.30}];
  var SUGARS = [{id:'none'},{id:'one'},{id:'two'}];
  var EXTRAS = [{id:'vanilla',delta:0.30},{id:'caramel',delta:0.30},{id:'hazelnut',delta:0.30},{id:'extra_espresso',delta:0.60}];
  var FLOORS = [1,2,3,4,5,6];

  var STATUS_META = {
    new:       {color:'var(--status-new)',       bg:'var(--status-new-bg)',       order:0, next:'accepted'},
    accepted:  {color:'var(--status-accepted)',  bg:'var(--status-accepted-bg)',  order:1, next:'preparing'},
    preparing: {color:'var(--status-preparing)', bg:'var(--status-preparing-bg)', order:2, next:'ready'},
    ready:     {color:'var(--status-ready)',     bg:'var(--status-ready-bg)',     order:3, next:'done'},
    done:      {color:'var(--status-done)',      bg:'var(--status-done-bg)',      order:4, next:null},
    cancelled: {color:'var(--status-cancel)',    bg:'var(--status-cancel-bg)',    order:5, next:null}
  };
  function statusOf(key){
    var m = STATUS_META[key];
    var i18n = t('status.'+key);
    return Object.assign({}, m, {label: i18n.label, nextLabel: i18n.nextLabel});
  }
  var ACTIVE_STATUSES = ['new','accepted','preparing','ready'];

  function menuLabel(id){ var m = t('menu.'+id); return m ? m.name : id; }
  function menuDesc(id){ var m = t('menu.'+id); return m ? m.desc : ''; }
  function tempLabel(id){ return t('temps.'+id); }
  function milkLabel(id){ return t('milks.'+id); }
  function sugarLabel(id){ return t('sugars.'+id); }
  function extraLabel(id){ return t('extras.'+id); }

  /* ---------------- local state ---------------- */
  var state = { orders: [] };
  // Роль больше НЕ выбирается пользователем и не хранится в localStorage -
  // она определяется сервером: обычный сотрудник входит анонимно и всегда
  // 'employee'; 'barista' присваивается только если текущий залогиненный
  // Firebase-пользователь есть в коллекции staff/ (проверяется в determineRole()).
  // Раньше это был клиентский переключатель без какой-либо проверки прав -
  // см. историю в firestore.rules и "Что доработать" в DEPLOY.md.
  var role = 'employee';
  var prefName = localStorage.getItem('muffin_name') || '';
  var prefFloor = localStorage.getItem('muffin_floor') || '';
  var tracked = {};
  try{ tracked = JSON.parse(localStorage.getItem('muffin_tracked')||'{}'); }catch(e){}

  /* ---------------- theme (auto / light / dark) ----------------
     'auto' follows the OS via prefers-color-scheme (default, see styles.css);
     'light'/'dark' pin an explicit choice via [data-theme] and persist it.
     The initial paint is handled by an inline script in index.html (runs
     before CSS/JS load) so a stored preference never flashes the wrong
     theme for a moment - this just keeps the button in sync afterwards. */
  var THEME_CYCLE = ['auto','light','dark'];
  var theme = localStorage.getItem('muffin_theme') || 'auto';
  if(THEME_CYCLE.indexOf(theme) === -1) theme = 'auto';

  function applyTheme(){
    if(theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if(btn) btn.textContent = t('themeLabel')[theme];
  }

  function cycleTheme(){
    theme = THEME_CYCLE[(THEME_CYCLE.indexOf(theme)+1) % THEME_CYCLE.length];
    localStorage.setItem('muffin_theme', theme);
    applyTheme();
  }

  /* ---------------- language (ru / az) ----------------
     Persisted like theme; switching re-renders the whole shell since
     virtually every string on the page depends on it (see I18N above). */
  var lastConn = {ok:null,label:null};
  var installPromptShown = false;

  function applyLangMeta(){
    document.documentElement.lang = lang;
    document.title = t('pageTitle');
  }

  function cycleLang(){
    lang = LANG_CYCLE[(LANG_CYCLE.indexOf(lang)+1) % LANG_CYCLE.length];
    localStorage.setItem('muffin_lang', lang);
    applyLangMeta();
    renderShell();
    if(lastConn.ok != null) setConn(lastConn.ok, lastConn.label);
    if(installPromptShown){ var btn = document.getElementById('install-btn'); if(btn) btn.classList.add('show'); }
  }

  // Populated once the Firebase SDK (loaded dynamically, see loadFirebase) is ready.
  // Everything renders from `state` regardless of whether this is set, so a slow or
  // failed network never leaves the page blank — only live sync/actions are gated on it.
  var fb = null;
  var unsubscribeOrders = null;

  function setConn(ok, label){
    lastConn = {ok: ok, label: label || null};
    var dot = document.getElementById('conn-dot');
    var lbl = document.getElementById('conn-label');
    if(!dot) return;
    dot.classList.toggle('off', !ok);
    if(lbl) lbl.textContent = label || (ok ? t('connOnline') : t('connOffline'));
  }

  function showOfflineBanner(msg){
    var b = document.getElementById('banner');
    if(!b) return;
    b.innerHTML = msg;
    b.classList.add('show');
  }
  function hideOfflineBanner(){
    var b = document.getElementById('banner');
    if(b) b.classList.remove('show');
  }

  /* ---------------- firebase (loaded lazily, app UI never blocks on it) ---------------- */
  async function loadFirebase(){
    setConn(false, t('connConnecting'));
    try{
      var appMod = await import(/* webpackIgnore: true */ FIREBASE_APP_URL);
      var fsMod  = await import(/* webpackIgnore: true */ FIREBASE_FIRESTORE_URL);
      var authMod = await import(/* webpackIgnore: true */ FIREBASE_AUTH_URL);

      var app = appMod.initializeApp(firebaseConfig);
      var db = fsMod.getFirestore(app);
      var auth = authMod.getAuth(app);
      fb = { app: app, db: db, auth: auth, fs: fsMod, authMod: authMod };

      authMod.onAuthStateChanged(auth, function(user){
        if(user){ determineRoleAndSubscribe(user); }
      });
      await authMod.signInAnonymously(auth);
    }catch(err){
      console.error('Firebase недоступен', err);
      fb = null;
      setConn(false, t('connOffline'));
      showOfflineBanner('<b>'+esc(t('offlineBannerTitle'))+'</b>&nbsp;' + esc(t('offlineBannerMsg')));
    }
  }

  // Определяет, бариста ли текущий залогиненный пользователь (по наличию
  // staff/{uid} в Firestore - см. firestore.rules), и подписывается на
  // заказы соответствующим запросом. Вызывается при каждой смене auth-сессии
  // (анонимный вход сотрудника, вход/выход бариста).
  async function determineRoleAndSubscribe(user){
    var wasBarista = role === 'barista';
    try{
      var staffDoc = await fb.fs.getDoc(fb.fs.doc(fb.db, 'staff', user.uid));
      role = staffDoc.exists() ? 'barista' : 'employee';
    }catch(err){
      console.error('role check failed', err);
      role = 'employee';
    }
    if(unsubscribeOrders){ unsubscribeOrders(); unsubscribeOrders = null; }
    subscribeOrders(user.uid);
    applyRole();
    if(wasBarista !== (role==='barista')) setBaristaLoginUI();
  }

  function subscribeOrders(uid){
    var q = role === 'barista'
      ? fb.fs.query(fb.fs.collection(fb.db, 'orders'), fb.fs.orderBy('createdAt', 'desc'))
      : fb.fs.query(fb.fs.collection(fb.db, 'orders'), fb.fs.where('creatorUid', '==', uid), fb.fs.orderBy('createdAt', 'desc'));
    unsubscribeOrders = fb.fs.onSnapshot(q, function(snap){
      hideOfflineBanner();
      setConn(true);
      state.orders = snap.docs.map(function(d){
        var v = d.data();
        return Object.assign({}, v, {
          docId: d.id,
          id: v.ticketId || d.id,
          createdAt: v.createdAt && v.createdAt.toDate ? v.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: v.updatedAt && v.updatedAt.toDate ? v.updatedAt.toDate().toISOString() : new Date().toISOString()
        });
      });
      renderOrderLists();
    }, function(err){
      console.error('orders snapshot error', err);
      setConn(false, t('connError'));
      showOfflineBanner(esc(t('ordersFetchErrorBanner')));
    });
  }

  window.addEventListener('online', function(){ if(fb) setConn(true); });
  window.addEventListener('offline', function(){ setConn(false); });

  async function nextTicketNumber(){
    var counterRef = fb.fs.doc(fb.db, 'counters', 'tickets');
    return await fb.fs.runTransaction(fb.db, async function(tx){
      var snap = await tx.get(counterRef);
      var current = snap.exists() ? (snap.data().value || 0) : 0;
      var next = current + 1;
      tx.set(counterRef, { value: next }, { merge: true });
      return next;
    });
  }

  /* ---------------- helpers ---------------- */
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function money(n){ return n.toFixed(2).replace('.', ',') + ' ₼'; }
  function timeAgo(iso){
    var d = new Date(iso), diff = Math.max(0, Math.round((Date.now()-d.getTime())/60000));
    if(diff < 1) return t('justNow');
    if(diff < 60) return diff + ' ' + t('minAbbrev');
    var h = Math.floor(diff/60);
    return h + ' ' + t('hourAbbrev') + ' ' + (diff%60) + ' ' + t('minAbbrev');
  }
  function clockStr(iso){
    var d = new Date(iso);
    var hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
    return hh+':'+mm;
  }
  function findOrder(docId){
    for(var i=0;i<state.orders.length;i++){ if(state.orders[i].docId===docId) return state.orders[i]; }
    return null;
  }
  function priceOf(sel){
    var d = MENU.filter(function(m){return m.id===sel.drinkId;})[0];
    if(!d) return 0;
    var p = d.base;
    var tp = TEMPS.filter(function(t){return t.id===sel.temp;})[0]; if(tp) p += tp.delta;
    var sz = SIZES.filter(function(s){return s.id===sel.size;})[0]; if(sz) p += sz.delta;
    var mk = MILKS.filter(function(m){return m.id===sel.milk;})[0]; if(mk) p += mk.delta;
    (sel.extras||[]).forEach(function(exId){
      var ex = EXTRAS.filter(function(e){return e.id===exId;})[0];
      if(ex) p += ex.delta;
    });
    return Math.round(p*100)/100;
  }
  function optsLine(o){
    var parts = [o.size, milkLabel(o.milk), sugarLabel(o.sugar)];
    if(o.extras && o.extras.length) parts.push(o.extras.map(extraLabel).join(', '));
    return parts.join(' · ');
  }
  function displayName(o){
    var label = menuLabel(o.drinkId) || o.drinkName;
    if(o.temp === 'cold'){
      return '<span class="ice-tag">'+esc(t('iceTag'))+'</span> ' + esc(label);
    }
    return esc(label);
  }

  /* ---------------- shell (rendered once, independent of Firebase) ---------------- */
  function renderShell(){
    var root = document.getElementById('root');
    root.innerHTML =
      '<div class="topbar">'+
        '<div class="brand"><span class="brand-mark">Muffin <span>·</span> '+esc(t('brandSuffix'))+'</span></div>'+
        '<div style="display:flex;align-items:center;">'+
          '<span class="conn-wrap"><span class="conn-dot" id="conn-dot"></span><span id="conn-label">'+esc(t('connConnecting'))+'</span></span>'+
          '<button type="button" class="install-btn show" id="lang-toggle" style="margin-right:8px;"></button>'+
          '<button type="button" class="install-btn show" id="theme-toggle" style="margin-right:8px;"></button>'+
          '<button type="button" class="install-btn" id="install-btn">'+esc(t('installBtn'))+'</button>'+
          '<div class="barista-login" id="barista-login" style="margin-left:10px;"></div>'+
        '</div>'+
      '</div>'+
      '<div class="banner" id="banner"></div>'+

      '<section class="view" id="view-employee">'+
        '<p class="intro">'+esc(t('employeeIntro'))+'</p>'+
        '<div class="emp-grid">'+
          '<form class="panel" id="order-form" novalidate>'+
            '<h2>'+esc(t('newOrderHeading'))+'</h2>'+
            '<div class="field"><label>'+esc(t('fieldDrink'))+'</label><div class="drink-grid" id="drink-grid"></div></div>'+
            '<div class="field"><label>'+esc(t('fieldTemp'))+'</label><div class="seg" id="temp-seg"></div></div>'+
            '<div class="field"><label>'+esc(t('fieldSize'))+'</label><div class="seg" id="size-seg"></div></div>'+
            '<div class="field"><label>'+esc(t('fieldMilk'))+'</label><div class="seg" id="milk-seg"></div></div>'+
            '<div class="field"><label>'+esc(t('fieldSugar'))+'</label><div class="seg" id="sugar-seg"></div></div>'+
            '<div class="field"><label>'+esc(t('fieldExtras'))+'</label><div class="chips" id="extra-chips"></div></div>'+
            '<div class="field"><label for="f-note">'+esc(t('fieldNoteLabel'))+'</label>'+
              '<textarea class="note" id="f-note" maxlength="140" placeholder="'+esc(t('notePlaceholder'))+'"></textarea>'+
            '</div>'+
            '<div class="row2">'+
              '<div class="field"><label for="f-name">'+esc(t('fieldNameLabel'))+'</label><input type="text" id="f-name" maxlength="40" placeholder="'+esc(t('namePlaceholder'))+'" autocomplete="off"></div>'+
              '<div class="field"><label for="f-floor">'+esc(t('fieldFloorLabel'))+'</label>'+
                '<select id="f-floor"><option value="">—</option>'+
                  FLOORS.map(function(n){return '<option value="'+n+'">'+n+' '+esc(t('floorUnit'))+'</option>';}).join('')+
                '</select>'+
              '</div>'+
            '</div>'+
            '<div class="price-row"><span class="lbl">'+esc(t('priceTotalLabel'))+'</span><span class="amt mono" id="price-amt">0,00 ₼</span></div>'+
            '<button type="submit" class="btn-primary" id="submit-btn">'+esc(t('submitBtn'))+'</button>'+
            '<div class="form-err" id="form-err"></div>'+
          '</form>'+
          '<div>'+
            '<h2 style="font-size:1.05rem;margin-bottom:12px;">'+esc(t('myOrdersHeading'))+'</h2>'+
            '<div class="orders-list" id="employee-orders"></div>'+
          '</div>'+
        '</div>'+
      '</section>'+

      '<section class="view" id="view-barista">'+
        '<p class="intro">'+esc(t('baristaIntro'))+'</p>'+
        '<div class="board-summary" id="board-summary"></div>'+
        '<div class="board" id="board"></div>'+
        '<details class="history"><summary>'+esc(t('historySummary'))+' <span class="mono" id="hist-count" style="color:var(--ink-faint);font-weight:600;"></span></summary>'+
          '<div class="hist-scroll"><table class="hist-table" id="hist-table"><thead><tr>'+
            '<th>'+esc(t('histTicket'))+'</th><th>'+esc(t('histWho'))+'</th><th>'+esc(t('histDrink'))+'</th>'+
            '<th>'+esc(t('histSum'))+'</th><th>'+esc(t('histStatus'))+'</th><th>'+esc(t('histTime'))+'</th>'+
          '</tr></thead><tbody id="hist-body"></tbody></table></div>'+
        '</details>'+
      '</section>'+

      '<p class="footer-note">'+esc(t('footerNote'))+'</p>'+
      '<div class="toast" id="toast"></div>';

    buildFormControls();
    wireForm();
    setBaristaLoginUI();
    applyRole();

    applyTheme();
    applyLangMeta();
    var themeBtn = document.getElementById('theme-toggle');
    if(themeBtn) themeBtn.addEventListener('click', cycleTheme);
    var langBtn = document.getElementById('lang-toggle');
    if(langBtn){ langBtn.textContent = t('langToggleLabel'); langBtn.addEventListener('click', cycleLang); }
  }

  /* ---------------- barista login (replaces the old client-only role toggle) ----------------
     Вход бариста - настоящая Firebase Auth сессия (email+пароль), а не
     переключатель в UI. Обычный сотрудник эту форму видит, но без верных
     учётных данных бариста попасть в панель бариста не может - см.
     firestore.rules (isBarista() проверяется на сервере). */
  function setBaristaLoginUI(){
    var box = document.getElementById('barista-login');
    if(!box) return;
    if(role === 'barista' && fb && fb.auth.currentUser){
      box.innerHTML = '<span style="margin-right:8px;color:var(--ink-faint);font-size:.85rem;">'+esc(t('baristaLabelPrefix'))+esc(fb.auth.currentUser.email||'')+'</span>'+
        '<button type="button" id="barista-logout-btn" class="install-btn show">'+esc(t('baristaLogoutBtn'))+'</button>';
      var logoutBtn = document.getElementById('barista-logout-btn');
      if(logoutBtn) logoutBtn.addEventListener('click', baristaLogout);
    } else {
      box.innerHTML = '<button type="button" id="barista-login-btn" class="install-btn show">'+esc(t('baristaLoginBtn'))+'</button>';
      var loginBtn = document.getElementById('barista-login-btn');
      if(loginBtn) loginBtn.addEventListener('click', openBaristaLoginPrompt);
    }
  }

  function openBaristaLoginPrompt(){
    if(!fb){ showToast(t('noConnectionToast')); return; }
    var email = window.prompt(t('baristaEmailPrompt'));
    if(!email) return;
    var password = window.prompt(t('baristaPasswordPrompt'));
    if(!password) return;
    fb.authMod.signInWithEmailAndPassword(fb.auth, email, password).catch(function(err){
      console.error('barista login failed', err);
      showToast(t('baristaLoginFailedToast'));
    });
    // Успешный вход сам вызовет onAuthStateChanged -> determineRoleAndSubscribe,
    // который выставит role='barista' только если email действительно есть в staff/.
  }

  function baristaLogout(){
    if(!fb) return;
    fb.authMod.signOut(fb.auth).then(function(){
      return fb.authMod.signInAnonymously(fb.auth);
    }).catch(function(err){ console.error('logout failed', err); });
    // onAuthStateChanged подхватит новую анонимную сессию и вернёт role='employee'.
  }

  function buildFormControls(){
    document.getElementById('drink-grid').innerHTML = MENU.map(function(m,i){
      return '<label class="drink-opt"><input type="radio" name="drink" value="'+m.id+'"'+(i===0?' checked':'')+'>'+
        '<span class="dn">'+esc(menuLabel(m.id))+'</span><span class="dp">'+esc(menuDesc(m.id))+' · '+money(m.base)+'</span></label>';
    }).join('');

    document.getElementById('temp-seg').innerHTML = TEMPS.map(function(tp,i){
      return '<label><input type="radio" name="temp" value="'+esc(tp.id)+'"'+(i===0?' checked':'')+'>'+esc(tempLabel(tp.id))+(tp.delta?(' +'+money(tp.delta)):'')+'</label>';
    }).join('');

    document.getElementById('size-seg').innerHTML = SIZES.map(function(s,i){
      return '<label><input type="radio" name="size" value="'+s.id+'"'+(i===1?' checked':'')+'>'+s.id+'</label>';
    }).join('');

    document.getElementById('milk-seg').innerHTML = MILKS.map(function(m,i){
      return '<label><input type="radio" name="milk" value="'+esc(m.id)+'"'+(i===0?' checked':'')+'>'+esc(milkLabel(m.id))+'</label>';
    }).join('');

    document.getElementById('sugar-seg').innerHTML = SUGARS.map(function(s,i){
      return '<label><input type="radio" name="sugar" value="'+esc(s.id)+'"'+(i===0?' checked':'')+'>'+esc(sugarLabel(s.id))+'</label>';
    }).join('');

    document.getElementById('extra-chips').innerHTML = EXTRAS.map(function(e){
      return '<label class="chip"><input type="checkbox" name="extra" value="'+esc(e.id)+'">'+esc(extraLabel(e.id))+' +'+money(e.delta)+'</label>';
    }).join('');

    var nameEl = document.getElementById('f-name'); if(prefName) nameEl.value = prefName;
    var floorEl = document.getElementById('f-floor'); if(prefFloor) floorEl.value = prefFloor;
  }

  function currentSelection(){
    var form = document.getElementById('order-form');
    var drink = form.querySelector('input[name="drink"]:checked');
    var temp = form.querySelector('input[name="temp"]:checked');
    var size = form.querySelector('input[name="size"]:checked');
    var milk = form.querySelector('input[name="milk"]:checked');
    var sugar = form.querySelector('input[name="sugar"]:checked');
    var extras = Array.prototype.map.call(form.querySelectorAll('input[name="extra"]:checked'), function(el){return el.value;});
    return {
      drinkId: drink ? drink.value : MENU[0].id,
      temp: temp ? temp.value : TEMPS[0].id,
      size: size ? size.value : 'M',
      milk: milk ? milk.value : MILKS[0].id,
      sugar: sugar ? sugar.value : SUGARS[0].id,
      extras: extras
    };
  }

  function updatePrice(){
    document.getElementById('price-amt').textContent = money(priceOf(currentSelection()));
  }

  function setFormBusy(busy){
    var btn = document.getElementById('submit-btn');
    if(!btn) return;
    btn.disabled = busy;
    btn.textContent = busy ? t('submitBtnBusy') : t('submitBtn');
  }

  function wireForm(){
    var form = document.getElementById('order-form');
    form.addEventListener('change', updatePrice);
    updatePrice();

    document.getElementById('f-name').addEventListener('input', renderEmployeeOrders);
    document.getElementById('f-floor').addEventListener('change', renderEmployeeOrders);

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var errEl = document.getElementById('form-err');
      errEl.classList.remove('show');

      if(!fb){
        errEl.textContent = t('errNoConnection');
        errEl.classList.add('show');
        return;
      }

      var name = document.getElementById('f-name').value.trim();
      var floor = document.getElementById('f-floor').value;
      if(!name || !floor){
        errEl.textContent = t('errNameFloor');
        errEl.classList.add('show');
        return;
      }
      var sel = currentSelection();
      var note = document.getElementById('f-note').value.trim().slice(0,140);

      localStorage.setItem('muffin_name', name);
      localStorage.setItem('muffin_floor', floor);
      prefName = name; prefFloor = floor;

      setFormBusy(true);
      submitOrder({
        name: name, floor: floor,
        drinkId: sel.drinkId, drinkName: menuLabel(sel.drinkId),
        temp: sel.temp, size: sel.size, milk: sel.milk, sugar: sel.sugar, extras: sel.extras,
        note: note, price: priceOf(sel)
      }).then(function(ticketId){
        showToast(t('orderSentToast') + ticketId);
        document.getElementById('f-note').value = '';
        form.querySelectorAll('input[name="extra"]:checked').forEach(function(el){el.checked=false;});
        updatePrice();
      }).catch(function(err){
        console.error('submit failed', err);
        errEl.textContent = t('errSubmitFailed');
        errEl.classList.add('show');
      }).finally(function(){
        setFormBusy(false);
      });
    });
  }

  async function submitOrder(fields){
    var seq = await nextTicketNumber();
    var ticketId = 'M-' + seq;
    await fb.fs.addDoc(fb.fs.collection(fb.db, 'orders'), Object.assign({}, fields, {
      ticketId: ticketId,
      seq: seq,
      status: 'new',
      creatorUid: fb.auth.currentUser.uid,
      createdAt: fb.fs.serverTimestamp(),
      updatedAt: fb.fs.serverTimestamp()
    }));
    return ticketId;
  }

  function applyRole(){
    document.getElementById('view-employee').classList.toggle('active', role==='employee');
    document.getElementById('view-barista').classList.toggle('active', role==='barista');
    renderOrderLists();
  }

  var toastTimer = null;
  function showToast(msg){
    var t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 3200);
  }

  /* ---------------- dynamic lists (pure function of state) ---------------- */
  function renderOrderLists(){
    renderEmployeeOrders();
    renderBaristaBoard();
    renderHistory();
  }

  function renderEmployeeOrders(){
    var box = document.getElementById('employee-orders');
    if(!box) return;
    var name = (document.getElementById('f-name')||{}).value || prefName;
    var floor = (document.getElementById('f-floor')||{}).value || prefFloor;
    // state.orders для сотрудника уже приходит с сервера отфильтрованным по
    // creatorUid (см. subscribeOrders) - здесь просто ещё сортируем/режем,
    // без нужды дополнительно фильтровать по имени/этажу для приватности.
    var mine = state.orders.slice().sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0,15);

    if(!name || !floor){
      box.innerHTML = '<p class="empty-note">'+esc(t('fillNameFloorNote'))+'</p>';
      return;
    }
    if(!mine.length){
      box.innerHTML = '<p class="empty-note">'+esc(t('noOrdersYet'))+'</p>';
      return;
    }

    box.innerHTML = mine.map(function(o){
      var meta = statusOf(STATUS_META[o.status] ? o.status : 'new');
      var justReady = o.status==='ready' && tracked[o.docId] !== 'ready';
      var stepsOn = ACTIVE_STATUSES.concat(['done']);
      var curIdx = meta.order;
      var stepsHtml = stepsOn.map(function(s,i){
        return '<i class="'+(i<=curIdx && o.status!=='cancelled' ? 'on':'')+'" style="--st:'+meta.color+'"></i>';
      }).join('');
      return '<div class="ticket" style="--tc:'+meta.color+'">'+
        '<div class="ticket-price">'+money(o.price)+'</div>'+
        '<div class="ticket-top">'+
          '<div><div class="ticket-id">' + esc(o.id) + ' · ' + clockStr(o.createdAt) + '</div>'+
          '<div class="ticket-title">'+displayName(o)+' ('+esc(o.size)+')</div>'+
          '<div class="ticket-meta">'+esc(optsLine(o))+'</div></div>'+
        '</div>'+
        '<div style="margin-top:10px;"><span class="pill'+(justReady?' pulse':'')+'" style="--pc:'+meta.color+';--pb:'+meta.bg+'"><span class="dot"></span>'+esc(meta.label)+'</span></div>'+
        '<div class="steps">'+stepsHtml+'</div>'+
        (o.note ? '<div class="ticket-note">«'+esc(o.note)+'»</div>' : '')+
      '</div>';
    }).join('');

    mine.forEach(function(o){ tracked[o.docId] = o.status; });
    localStorage.setItem('muffin_tracked', JSON.stringify(tracked));
  }

  function renderBaristaBoard(){
    var board = document.getElementById('board');
    var summary = document.getElementById('board-summary');
    if(!board) return;

    summary.innerHTML = ACTIVE_STATUSES.map(function(s){
      var n = state.orders.filter(function(o){return o.status===s;}).length;
      var meta = statusOf(s);
      return '<span class="sum-chip"><i style="--dc:'+meta.color+'"></i>'+esc(meta.label)+' <b>'+n+'</b></span>';
    }).join('');

    board.innerHTML = ACTIVE_STATUSES.map(function(s){
      var meta = statusOf(s);
      var items = state.orders.filter(function(o){return o.status===s;})
        .sort(function(a,b){ return new Date(a.createdAt) - new Date(b.createdAt); });
      var cardsHtml = items.length ? items.map(function(o){ return baristaCard(o, meta); }).join('')
        : '<div class="col-empty">'+esc(t('colEmpty'))+'</div>';
      return '<div class="col">'+
        '<div class="col-head"><span class="name"><i style="--cc:'+meta.color+'"></i>'+esc(meta.label)+'</span>'+
        '<span class="count mono">'+items.length+'</span></div>'+
        cardsHtml+
      '</div>';
    }).join('');

    board.querySelectorAll('[data-advance]').forEach(function(btn){
      btn.addEventListener('click', function(){ advanceOrder(btn.getAttribute('data-advance')); });
    });
    board.querySelectorAll('[data-cancel]').forEach(function(btn){
      btn.addEventListener('click', function(){ cancelOrder(btn.getAttribute('data-cancel')); });
    });
  }

  function baristaCard(o, meta){
    var steamHtml = (o.status==='preparing' && o.temp !== 'cold') ? '<span class="steam"><i></i><i></i><i></i></span>' : '';
    return '<div class="b-card" style="--tc:'+meta.color+'">'+
      '<div class="row-top"><span class="b-id">'+esc(o.id)+'</span><span class="b-time">'+timeAgo(o.createdAt)+'</span></div>'+
      '<div class="b-who">'+esc(o.name)+'<span class="b-floor">'+esc(o.floor)+' '+esc(t('floorAbbrev'))+'</span></div>'+
      '<div class="b-drink">'+displayName(o)+' ('+esc(o.size)+')'+steamHtml+'</div>'+
      '<div class="b-opts">'+esc(optsLine(o))+'</div>'+
      (o.note ? '<div class="b-note">«'+esc(o.note)+'»</div>' : '')+
      '<div class="b-price">'+money(o.price)+'</div>'+
      '<div class="b-actions">'+
        (meta.nextLabel ? '<button type="button" class="b-btn" data-advance="'+o.docId+'">'+esc(meta.nextLabel)+'</button>' : '')+
        '<button type="button" class="b-btn ghost" data-cancel="'+o.docId+'" title="'+esc(t('cancelTitle'))+'">✕</button>'+
      '</div>'+
    '</div>';
  }

  function advanceOrder(docId){
    if(!fb){ showToast(t('noConnectionToast')); return; }
    var o = findOrder(docId);
    if(!o || !STATUS_META[o.status].next) return;
    fb.fs.updateDoc(fb.fs.doc(fb.db, 'orders', docId), { status: STATUS_META[o.status].next, updatedAt: fb.fs.serverTimestamp() })
      .catch(function(err){ console.error(err); showToast(t('updateStatusFailedToast')); });
  }

  function cancelOrder(docId){
    if(!fb){ showToast(t('noConnectionToast')); return; }
    var o = findOrder(docId);
    if(!o) return;
    fb.fs.updateDoc(fb.fs.doc(fb.db, 'orders', docId), { status: 'cancelled', updatedAt: fb.fs.serverTimestamp() })
      .catch(function(err){ console.error(err); showToast(t('cancelFailedToast')); });
  }

  function renderHistory(){
    var body = document.getElementById('hist-body');
    if(!body) return;
    var items = state.orders.filter(function(o){ return o.status==='done' || o.status==='cancelled'; })
      .sort(function(a,b){ return new Date(b.updatedAt) - new Date(a.updatedAt); })
      .slice(0,40);
    document.getElementById('hist-count').textContent = items.length ? ('('+items.length+')') : '';
    if(!items.length){
      body.innerHTML = '<tr><td colspan="6" style="color:var(--ink-faint);">'+esc(t('histEmpty'))+'</td></tr>';
      return;
    }
    body.innerHTML = items.map(function(o){
      var meta = statusOf(o.status);
      return '<tr><td class="mono">'+esc(o.id)+'</td><td>'+esc(o.name)+' · '+esc(o.floor)+' '+esc(t('floorAbbrev'))+'</td>'+
        '<td>'+displayName(o)+'</td><td class="mono">'+money(o.price)+'</td>'+
        '<td><span class="pill" style="--pc:'+meta.color+';--pb:'+meta.bg+'"><span class="dot"></span>'+esc(meta.label)+'</span></td>'+
        '<td class="mono">'+clockStr(o.updatedAt)+'</td></tr>';
    }).join('');
  }

  /* ---------------- PWA install prompt ---------------- */
  var deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredInstallPrompt = e;
    installPromptShown = true;
    var btn = document.getElementById('install-btn');
    if(btn) btn.classList.add('show');
  });
  window.addEventListener('appinstalled', function(){
    installPromptShown = false;
    var btn = document.getElementById('install-btn');
    if(btn) btn.classList.remove('show');
    deferredInstallPrompt = null;
  });
  function wireInstallButton(){
    var btn = document.getElementById('install-btn');
    if(!btn) return;
    btn.addEventListener('click', function(){
      if(!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.finally(function(){ deferredInstallPrompt = null; installPromptShown = false; btn.classList.remove('show'); });
    });
  }

  /* ---------------- init ---------------- */
  function init(){
    renderShell();       // UI is always usable, even fully offline or before Firebase loads
    wireInstallButton();
    loadFirebase();       // fire-and-forget; failure just keeps the app in read-only/offline mode

    if('serviceWorker' in navigator){
      window.addEventListener('load', function(){
        navigator.serviceWorker.register('sw.js').catch(function(e){ console.warn('sw register failed', e); });
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
