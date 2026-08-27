import { firebaseConfig } from "./firebase-config.js";

(function(){
  "use strict";

  var FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  var FIREBASE_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
  var FIREBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

  /* ---------------- menu data ---------------- */
  var MENU = [
    {id:'espresso',   name:'Эспрессо',        desc:'Крепкий, одна порция', base:2.00},
    {id:'americano',  name:'Американо',       desc:'Эспрессо с горячей водой', base:2.50},
    {id:'cappuccino', name:'Капучино',        desc:'Классика с молочной пеной', base:3.50},
    {id:'latte',      name:'Латте',           desc:'Мягкий, больше молока', base:3.50},
    {id:'flatwhite',  name:'Флэт Уайт',       desc:'Двойной эспрессо, бархатная пена', base:3.80},
    {id:'mocha',      name:'Мокко',           desc:'Эспрессо, шоколад, молочная пена', base:3.90},
    {id:'raf',        name:'Раф',             desc:'Взбитые сливки, ваниль', base:4.00},
    {id:'hotchoc',    name:'Горячий шоколад', desc:'Без кофеина', base:4.20}
  ];
  var TEMPS  = [{id:'Горячий',delta:0},{id:'Холодный',delta:0.30}];
  var SIZES  = [{id:'S',label:'S',delta:0},{id:'M',label:'M',delta:0.30},{id:'L',label:'L',delta:0.60}];
  var MILKS  = [{id:'Обычное',delta:0},{id:'Овсяное',delta:0.40},{id:'Миндальное',delta:0.40},{id:'Без лактозы',delta:0.30}];
  var SUGARS = ['Без сахара','1 ложка','2 ложки'];
  var EXTRAS = [{id:'Ваниль',delta:0.30},{id:'Карамель',delta:0.30},{id:'Лесной орех',delta:0.30},{id:'Доп. эспрессо',delta:0.60}];

  var STATUS = {
    new:       {label:'Новый',    color:'var(--status-new)',       bg:'var(--status-new-bg)',       order:0, next:'accepted', nextLabel:'Принять'},
    accepted:  {label:'Принят',   color:'var(--status-accepted)',  bg:'var(--status-accepted-bg)',  order:1, next:'preparing', nextLabel:'Готовить'},
    preparing: {label:'Готовится',color:'var(--status-preparing)', bg:'var(--status-preparing-bg)', order:2, next:'ready',    nextLabel:'Готово'},
    ready:     {label:'Готов',    color:'var(--status-ready)',     bg:'var(--status-ready-bg)',     order:3, next:'done',     nextLabel:'Выдан / оплачен'},
    done:      {label:'Забрали',  color:'var(--status-done)',      bg:'var(--status-done-bg)',      order:4, next:null},
    cancelled: {label:'Отменён',  color:'var(--status-cancel)',    bg:'var(--status-cancel-bg)',    order:5, next:null}
  };
  var ACTIVE_STATUSES = ['new','accepted','preparing','ready'];

  /* ---------------- local state ---------------- */
  var state = { orders: [] };
  var role = localStorage.getItem('muffin_role') || 'employee';
  var prefName = localStorage.getItem('muffin_name') || '';
  var prefFloor = localStorage.getItem('muffin_floor') || '';
  var tracked = {};
  try{ tracked = JSON.parse(localStorage.getItem('muffin_tracked')||'{}'); }catch(e){}

  // Populated once the Firebase SDK (loaded dynamically, see loadFirebase) is ready.
  // Everything renders from `state` regardless of whether this is set, so a slow or
  // failed network never leaves the page blank — only live sync/actions are gated on it.
  var fb = null;
  var unsubscribeOrders = null;

  function setConn(ok, label){
    var dot = document.getElementById('conn-dot');
    var lbl = document.getElementById('conn-label');
    if(!dot) return;
    dot.classList.toggle('off', !ok);
    if(lbl) lbl.textContent = label || (ok ? 'на связи' : 'нет сети');
  }

  function showOfflineBanner(msg){
    var b = document.getElementById('banner');
    if(!b) return;
    b.innerHTML = '<b>Нет связи с сервером.</b>&nbsp;' + msg;
    b.classList.add('show');
  }
  function hideOfflineBanner(){
    var b = document.getElementById('banner');
    if(b) b.classList.remove('show');
  }

  /* ---------------- firebase (loaded lazily, app UI never blocks on it) ---------------- */
  async function loadFirebase(){
    setConn(false, 'подключение…');
    try{
      var appMod = await import(/* webpackIgnore: true */ FIREBASE_APP_URL);
      var fsMod  = await import(/* webpackIgnore: true */ FIREBASE_FIRESTORE_URL);
      var authMod = await import(/* webpackIgnore: true */ FIREBASE_AUTH_URL);

      var app = appMod.initializeApp(firebaseConfig);
      var db = fsMod.getFirestore(app);
      var auth = authMod.getAuth(app);
      fb = { app: app, db: db, auth: auth, fs: fsMod, authMod: authMod };

      authMod.onAuthStateChanged(auth, function(user){
        if(user && !unsubscribeOrders){ subscribeOrders(); }
      });
      await authMod.signInAnonymously(auth);
    }catch(err){
      console.error('Firebase недоступен', err);
      fb = null;
      setConn(false, 'нет сети');
      showOfflineBanner('Заказы не отправляются и не обновляются, пока не восстановится соединение — либо ещё не настроен firebase-config.js (см. DEPLOY.md).');
    }
  }

  function subscribeOrders(){
    var q = fb.fs.query(fb.fs.collection(fb.db, 'orders'), fb.fs.orderBy('createdAt', 'desc'));
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
      setConn(false, 'ошибка связи');
      showOfflineBanner('Проблема при получении заказов с сервера.');
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
    if(diff < 1) return 'только что';
    if(diff < 60) return diff + ' мин';
    var h = Math.floor(diff/60);
    return h + ' ч ' + (diff%60) + ' мин';
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
    var parts = [o.size, o.milk, o.sugar];
    if(o.extras && o.extras.length) parts.push(o.extras.join(', '));
    return parts.join(' · ');
  }
  function displayName(o){
    if(o.temp === 'Холодный'){
      return '<span class="ice-tag">Айс</span> ' + esc(o.drinkName);
    }
    return esc(o.drinkName);
  }

  /* ---------------- shell (rendered once, independent of Firebase) ---------------- */
  function renderShell(){
    var root = document.getElementById('root');
    root.innerHTML =
      '<div class="topbar">'+
        '<div class="brand"><span class="brand-mark">Muffin <span>·</span> кофе</span></div>'+
        '<div style="display:flex;align-items:center;">'+
          '<span class="conn-wrap"><span class="conn-dot" id="conn-dot"></span><span id="conn-label">подключение…</span></span>'+
          '<button type="button" class="install-btn" id="install-btn">⤓ Установить</button>'+
          '<div class="role-switch" role="tablist" style="margin-left:10px;">'+
            '<button type="button" data-role="employee">Я сотрудник</button>'+
            '<button type="button" data-role="barista">Я бариста</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="banner" id="banner"></div>'+

      '<section class="view" id="view-employee">'+
        '<p class="intro">Выберите напиток, укажите имя и этаж — заказ сразу увидит бариста в «Muffin». Останется спуститься и оплатить на кассе.</p>'+
        '<div class="emp-grid">'+
          '<form class="panel" id="order-form" novalidate>'+
            '<h2>Новый заказ</h2>'+
            '<div class="field"><label>Напиток</label><div class="drink-grid" id="drink-grid"></div></div>'+
            '<div class="field"><label>Температура</label><div class="seg" id="temp-seg"></div></div>'+
            '<div class="field"><label>Размер</label><div class="seg" id="size-seg"></div></div>'+
            '<div class="field"><label>Молоко</label><div class="seg" id="milk-seg"></div></div>'+
            '<div class="field"><label>Сахар</label><div class="seg" id="sugar-seg"></div></div>'+
            '<div class="field"><label>Добавки</label><div class="chips" id="extra-chips"></div></div>'+
            '<div class="field"><label for="f-note">Комментарий (необязательно)</label>'+
              '<textarea class="note" id="f-note" maxlength="140" placeholder="Например: без сахара, погорячее"></textarea>'+
            '</div>'+
            '<div class="row2">'+
              '<div class="field"><label for="f-name">Имя</label><input type="text" id="f-name" maxlength="40" placeholder="Как к вам обращаться" autocomplete="off"></div>'+
              '<div class="field"><label for="f-floor">Этаж</label>'+
                '<select id="f-floor"><option value="">—</option>'+
                  [1,2,3,4,5,6,7,8,9,10].map(function(n){return '<option value="'+n+'">'+n+' этаж</option>';}).join('')+
                '</select>'+
              '</div>'+
            '</div>'+
            '<div class="price-row"><span class="lbl">Итого</span><span class="amt mono" id="price-amt">0,00 ₼</span></div>'+
            '<button type="submit" class="btn-primary" id="submit-btn">Отправить заказ</button>'+
            '<div class="form-err" id="form-err"></div>'+
          '</form>'+
          '<div>'+
            '<h2 style="font-size:1.05rem;margin-bottom:12px;">Мои заказы</h2>'+
            '<div class="orders-list" id="employee-orders"></div>'+
          '</div>'+
        '</div>'+
      '</section>'+

      '<section class="view" id="view-barista">'+
        '<p class="intro">Заказы из офиса — по мере готовности переводите тикет дальше по статусам.</p>'+
        '<div class="board-summary" id="board-summary"></div>'+
        '<div class="board" id="board"></div>'+
        '<details class="history"><summary>История (выдано / отменено) <span class="mono" id="hist-count" style="color:var(--ink-faint);font-weight:600;"></span></summary>'+
          '<div class="hist-scroll"><table class="hist-table" id="hist-table"><thead><tr>'+
            '<th>Тикет</th><th>Кто</th><th>Напиток</th><th>Сумма</th><th>Статус</th><th>Время</th>'+
          '</tr></thead><tbody id="hist-body"></tbody></table></div>'+
        '</details>'+
      '</section>'+

      '<p class="footer-note">Внутренний заказ кофе для офиса · кофейня Muffin</p>'+
      '<div class="toast" id="toast"></div>';

    buildFormControls();
    wireForm();
    wireRoleSwitch();
    applyRole();
  }

  function buildFormControls(){
    document.getElementById('drink-grid').innerHTML = MENU.map(function(m,i){
      return '<label class="drink-opt"><input type="radio" name="drink" value="'+m.id+'"'+(i===0?' checked':'')+'>'+
        '<span class="dn">'+esc(m.name)+'</span><span class="dp">'+esc(m.desc)+' · '+money(m.base)+'</span></label>';
    }).join('');

    document.getElementById('temp-seg').innerHTML = TEMPS.map(function(t,i){
      return '<label><input type="radio" name="temp" value="'+esc(t.id)+'"'+(i===0?' checked':'')+'>'+esc(t.id)+(t.delta?(' +'+money(t.delta)):'')+'</label>';
    }).join('');

    document.getElementById('size-seg').innerHTML = SIZES.map(function(s,i){
      return '<label><input type="radio" name="size" value="'+s.id+'"'+(i===1?' checked':'')+'>'+s.label+'</label>';
    }).join('');

    document.getElementById('milk-seg').innerHTML = MILKS.map(function(m,i){
      return '<label><input type="radio" name="milk" value="'+esc(m.id)+'"'+(i===0?' checked':'')+'>'+esc(m.id)+'</label>';
    }).join('');

    document.getElementById('sugar-seg').innerHTML = SUGARS.map(function(s,i){
      return '<label><input type="radio" name="sugar" value="'+esc(s)+'"'+(i===0?' checked':'')+'>'+esc(s)+'</label>';
    }).join('');

    document.getElementById('extra-chips').innerHTML = EXTRAS.map(function(e){
      return '<label class="chip"><input type="checkbox" name="extra" value="'+esc(e.id)+'">'+esc(e.id)+' +'+money(e.delta)+'</label>';
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
      sugar: sugar ? sugar.value : SUGARS[0],
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
    btn.textContent = busy ? 'Отправляем…' : 'Отправить заказ';
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
        errEl.textContent = 'Нет связи с сервером — заказ пока не может быть отправлен.';
        errEl.classList.add('show');
        return;
      }

      var name = document.getElementById('f-name').value.trim();
      var floor = document.getElementById('f-floor').value;
      if(!name || !floor){
        errEl.textContent = 'Укажите имя и этаж, чтобы бариста знал, кому нести заказ.';
        errEl.classList.add('show');
        return;
      }
      var sel = currentSelection();
      var drink = MENU.filter(function(m){return m.id===sel.drinkId;})[0];
      var note = document.getElementById('f-note').value.trim().slice(0,140);

      localStorage.setItem('muffin_name', name);
      localStorage.setItem('muffin_floor', floor);
      prefName = name; prefFloor = floor;

      setFormBusy(true);
      submitOrder({
        name: name, floor: floor,
        drinkId: sel.drinkId, drinkName: drink.name,
        temp: sel.temp, size: sel.size, milk: sel.milk, sugar: sel.sugar, extras: sel.extras,
        note: note, price: priceOf(sel)
      }).then(function(ticketId){
        showToast('Заказ отправлен · тикет ' + ticketId);
        document.getElementById('f-note').value = '';
        form.querySelectorAll('input[name="extra"]:checked').forEach(function(el){el.checked=false;});
        updatePrice();
      }).catch(function(err){
        console.error('submit failed', err);
        errEl.textContent = 'Не удалось отправить заказ. Проверьте связь и попробуйте ещё раз.';
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
      createdAt: fb.fs.serverTimestamp(),
      updatedAt: fb.fs.serverTimestamp()
    }));
    return ticketId;
  }

  function wireRoleSwitch(){
    document.querySelectorAll('.role-switch button').forEach(function(b){
      b.addEventListener('click', function(){
        role = b.getAttribute('data-role');
        localStorage.setItem('muffin_role', role);
        applyRole();
      });
    });
  }

  function applyRole(){
    document.querySelectorAll('.role-switch button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-role')===role);
    });
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
    var mine = state.orders.filter(function(o){
      return (o.name||'').trim().toLowerCase() === (name||'').trim().toLowerCase() && o.floor === floor;
    }).sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0,15);

    if(!name || !floor){
      box.innerHTML = '<p class="empty-note">Укажите имя и этаж слева — здесь появятся статусы ваших заказов.</p>';
      return;
    }
    if(!mine.length){
      box.innerHTML = '<p class="empty-note">Пока нет заказов. Оформите первый слева.</p>';
      return;
    }

    box.innerHTML = mine.map(function(o){
      var meta = STATUS[o.status] || STATUS.new;
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
        '<div style="margin-top:10px;"><span class="pill'+(justReady?' pulse':'')+'" style="--pc:'+meta.color+';--pb:'+meta.bg+'"><span class="dot"></span>'+meta.label+'</span></div>'+
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
      var meta = STATUS[s];
      return '<span class="sum-chip"><i style="--dc:'+meta.color+'"></i>'+meta.label+' <b>'+n+'</b></span>';
    }).join('');

    board.innerHTML = ACTIVE_STATUSES.map(function(s){
      var meta = STATUS[s];
      var items = state.orders.filter(function(o){return o.status===s;})
        .sort(function(a,b){ return new Date(a.createdAt) - new Date(b.createdAt); });
      var cardsHtml = items.length ? items.map(function(o){ return baristaCard(o, meta); }).join('')
        : '<div class="col-empty">Пусто</div>';
      return '<div class="col">'+
        '<div class="col-head"><span class="name"><i style="--cc:'+meta.color+'"></i>'+meta.label+'</span>'+
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
    var steamHtml = (o.status==='preparing' && o.temp !== 'Холодный') ? '<span class="steam"><i></i><i></i><i></i></span>' : '';
    return '<div class="b-card" style="--tc:'+meta.color+'">'+
      '<div class="row-top"><span class="b-id">'+esc(o.id)+'</span><span class="b-time">'+timeAgo(o.createdAt)+'</span></div>'+
      '<div class="b-who">'+esc(o.name)+'<span class="b-floor">'+esc(o.floor)+' эт.</span></div>'+
      '<div class="b-drink">'+displayName(o)+' ('+esc(o.size)+')'+steamHtml+'</div>'+
      '<div class="b-opts">'+esc(optsLine(o))+'</div>'+
      (o.note ? '<div class="b-note">«'+esc(o.note)+'»</div>' : '')+
      '<div class="b-price">'+money(o.price)+'</div>'+
      '<div class="b-actions">'+
        '<button type="button" class="b-btn" data-advance="'+o.docId+'">'+meta.nextLabel+'</button>'+
        '<button type="button" class="b-btn ghost" data-cancel="'+o.docId+'" title="Отменить">✕</button>'+
      '</div>'+
    '</div>';
  }

  function advanceOrder(docId){
    if(!fb){ showToast('Нет связи с сервером'); return; }
    var o = findOrder(docId);
    if(!o || !STATUS[o.status].next) return;
    fb.fs.updateDoc(fb.fs.doc(fb.db, 'orders', docId), { status: STATUS[o.status].next, updatedAt: fb.fs.serverTimestamp() })
      .catch(function(err){ console.error(err); showToast('Не удалось обновить статус'); });
  }

  function cancelOrder(docId){
    if(!fb){ showToast('Нет связи с сервером'); return; }
    var o = findOrder(docId);
    if(!o) return;
    fb.fs.updateDoc(fb.fs.doc(fb.db, 'orders', docId), { status: 'cancelled', updatedAt: fb.fs.serverTimestamp() })
      .catch(function(err){ console.error(err); showToast('Не удалось отменить заказ'); });
  }

  function renderHistory(){
    var body = document.getElementById('hist-body');
    if(!body) return;
    var items = state.orders.filter(function(o){ return o.status==='done' || o.status==='cancelled'; })
      .sort(function(a,b){ return new Date(b.updatedAt) - new Date(a.updatedAt); })
      .slice(0,40);
    document.getElementById('hist-count').textContent = items.length ? ('('+items.length+')') : '';
    if(!items.length){
      body.innerHTML = '<tr><td colspan="6" style="color:var(--ink-faint);">Пока пусто</td></tr>';
      return;
    }
    body.innerHTML = items.map(function(o){
      var meta = STATUS[o.status];
      return '<tr><td class="mono">'+esc(o.id)+'</td><td>'+esc(o.name)+' · '+esc(o.floor)+' эт.</td>'+
        '<td>'+displayName(o)+'</td><td class="mono">'+money(o.price)+'</td>'+
        '<td><span class="pill" style="--pc:'+meta.color+';--pb:'+meta.bg+'"><span class="dot"></span>'+meta.label+'</span></td>'+
        '<td class="mono">'+clockStr(o.updatedAt)+'</td></tr>';
    }).join('');
  }

  /* ---------------- PWA install prompt ---------------- */
  var deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredInstallPrompt = e;
    var btn = document.getElementById('install-btn');
    if(btn) btn.classList.add('show');
  });
  window.addEventListener('appinstalled', function(){
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
      deferredInstallPrompt.userChoice.finally(function(){ deferredInstallPrompt = null; btn.classList.remove('show'); });
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
