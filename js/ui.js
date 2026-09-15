'use strict';

/* ================= UI: РЕНДЕР, СОБЫТИЯ, КУПОН ================= */

const App = {
  user: null,
  matches: [],
  state: {
    tab: 'main',
    sport: 'all',
    sort: 'default',
    search: '',
    cart: [],            // выбранные маркеты {matchId, market, coef, label}
    cartMode: 'single',  // single | express
    stake: 100,
    selectedMatch: null,
    matchTab: 'overview', // overview | markets
  },
  el: {},
};

function $(sel) { return document.querySelector(sel); }
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/* ---------- ИНИЦИАЛИЗАЦИЯ UI ---------- */
function initUI(matches, user) {
  App.matches = matches;
  App.user = user;
  App.el = {
    content: $('#content'),
    balanceValue: $('#balanceValue'),
    liveCount: $('#liveCount'),
    sportTabs: $('#sportTabs'),
    couponBody: $('#couponBody'),
    couponCount: $('#couponCount'),
    couponOdds: $('#couponOdds'),
    couponClear: $('#couponClear'),
    searchInput: $('#searchInput'),
    profileBtn: $('#profileBtn'),
    depositBtn: $('#depositBtn'),
    logoutBtn: $('#logoutBtn'),
    toasts: $('#toasts'),
    overlay: $('#overlay'),
    authModal: $('#authModal'),
    authForm: $('#authForm'),
    authLogin: $('#authLogin'),
    authPass: $('#authPass'),
    authMsg: $('#authMsg'),
    profileModal: $('#profileModal'),
    profileBody: $('#profileBody'),
  };

  buildSportTabs();
  bindEvents();
  refreshHeader();
}

function bindEvents() {
  document.querySelectorAll('#topnav .tab').forEach(b => {
    b.addEventListener('click', () => {
      App.state.tab = b.dataset.tab;
      App.state.selectedMatch = null;
      if (b.dataset.tab === 'live') App.state.liveOnly = true;
      else if (b.dataset.tab === 'main') App.state.liveOnly = false;
      App.state.tab = b.dataset.tab;
      document.querySelectorAll('#topnav .tab').forEach(x => x.classList.toggle('active', x === b));
      refreshAll();
    });
  });

  App.el.searchInput.addEventListener('input', () => {
    App.state.search = App.el.searchInput.value.trim().toLowerCase();
    refreshAll();
  });

  document.querySelectorAll('.vs-btn').forEach(b => {
    b.addEventListener('click', () => {
      App.state.sort = b.dataset.sort;
      document.querySelectorAll('.vs-btn').forEach(x => x.classList.toggle('active', x === b));
      refreshAll();
    });
  });

  App.el.couponClear.addEventListener('click', () => { App.state.cart = []; App.state.cartMode = 'single'; renderCoupon(); refreshAll(); });

  App.el.profileBtn.addEventListener('click', toggleProfile);
  App.el.depositBtn.addEventListener('click', () => {
    if (!App.user) { openAuth(); return; }
    const res = tryDailyDeposit(App.user);
    toast(res ? '+200 000 ₽ начислено (ежедневная выплата)' : 'Ежедневная выплата уже начислена сегодня', res ? 'ok' : 'err');
    refreshHeader();
    if (!App.el.profileModal.hidden) renderProfile();
  });
  App.el.logoutBtn.addEventListener('click', () => {
    Session.clear();
    App.user = null;
    refreshHeader();
    refreshAll();
    toast('Вы вышли из аккаунта');
  });

  App.el.overlay.addEventListener('click', closeModals);
  $('#authClose').addEventListener('click', closeModals);
  $('#profileClose').addEventListener('click', closeModals);

  document.querySelectorAll('[data-auth-tab]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-auth-tab]').forEach(x => x.classList.toggle('active', x === b));
      const isReg = b.dataset.authTab === 'register';
      $('#authTitle').textContent = isReg ? 'Регистрация' : 'Вход';
      $('#authForm button[type=submit]').textContent = isReg ? 'Создать аккаунт' : 'Войти';
      App.el.authMsg.textContent = '';
    });
  });

  App.el.authForm.addEventListener('submit', e => {
    e.preventDefault();
    const login = App.el.authLogin.value.trim();
    const pass = App.el.authPass.value;
    const isReg = $('[data-auth-tab].active').dataset.authTab === 'register';

    let res;
    if (isReg) {
      res = DB.register(login, pass);
      if (res.err) { App.el.authMsg.textContent = res.err; return; }
      App.user = res.user;
      Session.set(res.user.id);
      toast('Аккаунт создан!', 'ok');
    } else {
      const u = DB.findUser(login);
      if (!u || u.pass !== pass) { App.el.authMsg.textContent = 'Неверный логин или пароль'; return; }
      App.user = u;
      Session.set(u.id);
      toast('С возвращением, ' + u.login + '!', 'ok');
    }

    const added = tryDailyDeposit(App.user);
    if (added) toast('+200 000 ₽ — ежедневная выплата начислена', 'ok');

    App.el.authLogin.value = '';
    App.el.authPass.value = '';
    App.el.authMsg.textContent = '';
    closeModals();
    refreshHeader();
    refreshAll();
  });
}

function closeModals() {
  App.el.overlay.hidden = true;
  App.el.authModal.hidden = true;
  App.el.profileModal.hidden = true;
  document.querySelector('.coupon-wrap').style.display = '';
}

function buildSportTabs() {
  const tabs = [{ id: 'all', label: 'Все' }];
  Object.values(SPORTS).forEach(s => tabs.push({ id: s.id, label: s.name }));
  App.el.sportTabs.innerHTML = '';
  tabs.forEach(t => {
    const b = el('button', 'sptab', t.label);
    if (t.id === 'all') b.classList.add('active');
    b.addEventListener('click', () => {
      App.state.sport = t.id;
      document.querySelectorAll('.sptab').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      refreshAll();
    });
    App.el.sportTabs.appendChild(b);
  });
}

function refreshHeader() {
  const u = App.user;
  App.el.balanceValue.textContent = u ? fmtMoney(u.balance) : '—';
  const liveCount = App.matches.filter(m => m.status === 'live').length;
  App.el.liveCount.textContent = liveCount;
  App.el.liveCount.style.display = liveCount ? '' : 'none';

  if (u && u.id !== 0) {
    App.el.profileBtn.textContent = '👤 ' + u.login;
    App.el.logoutBtn.hidden = false;
  } else {
    App.el.profileBtn.textContent = '👤 Войти';
    App.el.logoutBtn.hidden = true;
  }
}

/* ---------- ФИЛЬТРАЦИЯ МАТЧЕЙ ---------- */
function filteredMatches() {
  let list = App.matches;

  if (App.state.tab === 'live') list = list.filter(m => m.status === 'live');
  if (App.state.sport !== 'all') list = list.filter(m => m.sport === App.state.sport);
  if (App.state.search) {
    const q = App.state.search;
    list = list.filter(m => (m.a + ' ' + m.b + ' ' + m.league).toLowerCase().includes(q));
  }

  const st = App.state.sort;
  if (st === 'live') list = [...list].sort((a, b) => (b.status === 'live' ? 1 : 0) - (a.status === 'live' ? 1 : 0));
  if (st === 'time') list = [...list].sort((a, b) => a.startOffset - b.startOffset);

  return list;
}

function groupByLeague(list) {
  const groups = {};
  list.forEach(m => {
    (groups[m.league] = groups[m.league] || []).push(m);
  });
  return groups;
}

/* ---------- РЕНДЕР ---------- */
function refreshAll() {
  const list = filteredMatches();

  const focused = document.activeElement;
  const wasStake = focused && focused.classList && focused.classList.contains('stake-input') && focused.value;

  App.el.content.innerHTML = '';
  const frag = document.createDocumentFragment();

  if (App.state.tab === 'results') {
    renderResults(frag);
  } else if (App.state.selectedMatch) {
    renderMatchDetail(frag);
  } else {
    if (list.length === 0) {
      frag.appendChild(el('div', 'empty', '<span class="emo">🏳️</span>Матчей не найдено'));
    } else {
      if (App.state.tab === 'live') {
        frag.appendChild(el('div', 'section-head', '🔴 LIVE <span class="more">' + list.length + ' матчей</span>'));
      }
      const groups = groupByLeague(list);
      Object.keys(groups).forEach(league => {
        const items = groups[league];
        const block = el('div', 'league-block fade-in');
        const lh = el('div', 'league-head', '');
        const leagueMeta = items[0];
        lh.appendChild(el('span', 'league-icon', leagueMeta.leagueIcon));
        lh.appendChild(el('span', 'league-name', league));
        const liveN = items.filter(x => x.status === 'live').length;
        if (liveN) lh.appendChild(el('span', 'league-live', 'LIVE ' + liveN));
        block.appendChild(lh);

        const ml = el('div', 'match-list');
        items.forEach(m => ml.appendChild(renderMatchRow(m)));
        block.appendChild(ml);
        frag.appendChild(block);
      });
    }
  }

  App.el.content.appendChild(frag);
  renderCoupon();

  if (wasStake && document.activeElement !== focused) {
    const inp = App.el.couponBody.querySelector('.stake-input');
    if (inp) {
      inp.focus();
      const len = inp.value.length;
      try { inp.setSelectionRange(len, len); } catch (e) {}
    }
  }
}

function renderMatchRow(m) {
  const row = el('div', 'match fade-in' + (m.status === 'live' ? ' live-match' : ''));

  const info = el('div', 'match-info');
  const ld = (name, score) => {
    const d = el('div', 'team-name',
      (score != null && m.status === 'live') ? name + ' <span class="score">' + score + '</span>' : name);
    return d;
  };
  info.appendChild(ld(m.a, m.sA));
  info.appendChild(ld(m.b, m.sB));

  const meta = el('div', 'match-meta');
  if (m.status === 'live') {
    meta.appendChild(el('span', 'live-badge', 'LIVE ' + Math.floor(m.minute) + "'"));
  } else if (m.status === 'upcoming') {
    meta.appendChild(el('span', '', '🕒 ' + m.time));
  } else {
    meta.appendChild(el('span', '', '✅ Финальный'));
  }
  meta.appendChild(el('span', '', m.leagueIcon + ' ' + m.league));
  info.appendChild(meta);
  row.appendChild(info);

  const oddsBox = el('div', 'odds');
  const od = m.status === 'live' ? m.liveOdds : m.odds;
  const mk = mainMarkets(m.sport);
  mk.forEach(x => { if (od[x.key] != null) oddsBox.appendChild(coefButton(m, x.key, od[x.key], x.label)); });
  if (m.sport === 'football' || m.sport === 'hockey') {
    oddsBox.appendChild(oddsMenuButton(m));
  }
  row.appendChild(oddsBox);

  row.style.cursor = 'pointer';
  row.querySelectorAll('.coef-btn, .odds-menu-btn').forEach(b => b.addEventListener('click', e => e.stopPropagation()));
  row.addEventListener('click', () => {
    App.state.selectedMatch = m.id;
    App.state.matchTab = 'overview';
    refreshAll();
  });
  return row;
}

function mainMarkets(sport) {
  if (sport === 'tennis' || sport === 'ufc' || sport === 'esports') {
    return [{ key: '1', label: 'П1' }, { key: '2', label: 'П2' }];
  }
  return [{ key: '1', label: '1' }, { key: 'X', label: 'X' }, { key: '2', label: '2' }];
}

function oddsMenuButton(m) {
  const wrap = el('div', 'odds-menu');
  const btn = el('button', 'odds-menu-btn', '⋯');
  const pop = el('div', 'odds-pop');
  pop.appendChild(el('div', 'pop-title', 'Больше рынков'));

  const mk = [
    { key: 'TB2.5', label: 'Тотал больше 2.5' },
    { key: 'TM2.5', label: 'Тотал меньше 2.5' },
    { key: 'TB1.5', label: 'Тотал больше 1.5' },
    { key: 'TM1.5', label: 'Тотал меньше 1.5' },
    { key: 'Ф1(-1)', label: 'Ф1 (-1)' },
    { key: 'Ф2(+1)', label: 'Ф2 (+1)' },
  ];
  const od = m.status === 'live' ? m.liveOdds : m.odds;
  mk.forEach(x => {
    if (od[x.key] == null) return;
    const b = coefButton(m, x.key, od[x.key], x.label);
    b.classList.add('w100');
    b.style.marginBottom = '6px';
    pop.appendChild(b);
  });

  btn.addEventListener('click', e => { e.stopPropagation(); pop.classList.toggle('open'); });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) pop.classList.remove('open'); });
  wrap.appendChild(btn);
  wrap.appendChild(pop);
  return wrap;
}

function coefButton(m, key, v, label) {
  const b = el('button', 'coef-btn', '');
  b.innerHTML = '<span class="c-label">' + esc(label || key) + '</span>' + v.toFixed(2);
  if (isInCart(m.id, key)) b.classList.add('selected');

  b.addEventListener('click', () => {
    toggleCart(m, key, v);
    refreshAll();
  });
  return b;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function isInCart(matchId, market) {
  return App.state.cart.some(c => c.matchId === matchId && c.market === market);
}

function toggleCart(m, key, v) {
  const i = App.state.cart.findIndex(c => c.matchId === m.id && c.market === key);
  if (i >= 0) {
    App.state.cart.splice(i, 1);
    toast('Убрано из купона');
  } else {
    App.state.cart.push({
      matchId: m.id,
      market: key,
      coef: v,
      label: key,
      team: (mainMarkets(m.sport).find(x => x.key === key) || {}).label || key,
      match: m,
    });
    toast('Добавлено в купон');
    if (App.state.cart.length > 1 && App.state.cartMode === 'single') App.state.cartMode = 'express';
  }
}

/* ---------- КУПОН ---------- */
function cartCoef() {
  if (App.state.cart.length === 0) return 0;
  return App.state.cart.reduce((acc, c) => acc * c.coef, 1);
}

function renderCoupon() {
  const body = App.el.couponBody;
  App.el.couponCount.textContent = App.state.cart.length;
  App.el.couponOdds.textContent = cartCoef().toFixed(2);
  body.innerHTML = '';

  const cart = App.state.cart;
  if (cart.length === 0) {
    body.appendChild(el('div', 'win-note', 'Выберите исходы, чтобы собрать купон'));
    return;
  }

  const mode = el('div', 'coupon-mode');
  const single = el('button', 'Одиночная');
  const express = el('button', 'Экспресс');
  if (cart.length < 2) { single.classList.add('active'); }
  else {
    single.classList.toggle('active', App.state.cartMode === 'single');
    express.classList.toggle('active', App.state.cartMode === 'express');
  }
  single.disabled = cart.length > 1;
  express.disabled = cart.length < 2;
  single.addEventListener('click', () => { App.state.cartMode = 'single'; renderCoupon(); });
  express.addEventListener('click', () => { App.state.cartMode = 'express'; renderCoupon(); });
  mode.appendChild(single);
  mode.appendChild(express);
  body.appendChild(mode);

  cart.forEach(c => {
    const it = el('div', 'cp-item');
    it.innerHTML =
      '<div><span class="mk">' + esc(c.match.a + ' — ' + c.match.b) + '</span><br>' + esc(c.team) +
      ' <span class="mk">' + esc(c.market) + '</span></div>' +
      '<span class="coef">' + c.coef.toFixed(2) + '</span>' +
      '<span class="rm">✕</span>';
    it.querySelector('.rm').addEventListener('click', () => {
      App.state.cart.splice(App.state.cart.indexOf(c), 1);
      if (App.state.cart.length < 2) App.state.cartMode = 'single';
      renderCoupon();
      refreshAll();
    });
    body.appendChild(it);
  });

  const qs = el('div', 'quick-stakes');
  [100, 500, 1000, 5000].forEach(v => {
    const b = el('button', App.state.stake === v ? 'active' : '', v.toLocaleString('ru-RU'));
    b.addEventListener('click', () => { App.state.stake = v; renderCoupon(); });
    qs.appendChild(b);
  });
  body.appendChild(qs);

  const input = el('input', 'stake-input');
  input.type = 'number';
  input.min = 50;
  input.step = 50;
  input.value = App.state.stake;
  input.addEventListener('input', () => {
    App.state.stake = Math.max(0, parseInt(input.value, 10) || 0);
    renderCouponBodySummary();
  });
  body.appendChild(input);

  const summaryBox = el('div', 'coupon-summary');
  body.appendChild(summaryBox);

  const u = App.user;
  let can = false, errMsg = '';
  if (!u) errMsg = 'Войдите, чтобы сделать ставку';
  else if (App.state.stake < 50) errMsg = 'Минимальная ставка — 50 ₽';
  else if (u.balance < App.state.stake) errMsg = 'Недостаточно средств';
  else if (App.state.cartMode === 'express' && cart.length < 2) errMsg = 'Для экспресса нужно 2+ исхода';
  else can = true;

  const place = el('button', 'btn w100 ' + (can ? 'btn-accent' : 'btn-ghost'), errMsg || 'Сделать ставку');
  place.disabled = !can;
  place.addEventListener('click', placeBet);
  body.appendChild(place);

  paintSummary(summaryBox, can ? '' : errMsg);
}

/* перерисовка только итоговой строки при печати суммы */
function renderCouponBodySummary() {
  const sb = App.el.couponBody.querySelector('.coupon-summary');
  if (sb) paintSummary(sb, '');
}

function paintSummary(box, note) {
  const potential = Math.round(App.state.stake * cartCoef());
  box.innerHTML =
    '<div class="row"><span>Сумма</span><span><b>' + fmtMoney(App.state.stake) + '</b></span></div>' +
    '<div class="row"><span>Коэффициент</span><span><b>' + cartCoef().toFixed(2) + '</b></span></div>' +
    '<div class="row"><span>Возможный выигрыш</span><span class="win">' + fmtMoney(potential) + '</span></div>' +
    (note ? '<div class="row"><span class="k" style="color:var(--danger)">' + esc(note) + '</span></div>' : '');
}

function placeBet() {
  const u = App.user;
  if (!u) { toast('Нужно войти в аккаунт', 'err'); openAuth(); return; }

  const cart = App.state.cart;
  const stakes = [];
  if (App.state.cartMode === 'express' && cart.length >= 2) {
    stakes.push({
      type: 'express',
      legs: cart.map(c => ({
        matchId: c.matchId, market: c.market, label: c.label, team: c.team,
        coef: c.coef, match: c.match.a + ' — ' + c.match.b, settled: false, won: false,
      })),
      coef: cartCoef(), stake: App.state.stake, status: 'open',
    });
  } else {
    cart.forEach(c => {
      stakes.push({
        type: 'single',
        legs: [{
          matchId: c.matchId, market: c.market, label: c.label, team: c.team,
          coef: c.coef, match: c.match.a + ' — ' + c.match.b, settled: false, won: false,
        }],
        coef: c.coef, stake: App.state.stake, status: 'open',
      });
    });
  }

  const total = stakes.reduce((a, b) => a + b.stake, 0);
  if (total > u.balance) { toast('Недостаточно средств', 'err'); return; }

  stakes.forEach(b => addBet(u, b));
  App.state.cart = [];
  App.state.cartMode = 'single';
  App.state.stake = 100;
  refreshHeader();
  renderCoupon();
  refreshAll();
  toast('Ставка принята! Удачи 🍀', 'ok');
}

/* ---------- СТРАНИЦА МАТЧА ---------- */
function renderMatchDetail(frag) {
  const m = App.matches.find(x => x.id === App.state.selectedMatch);
  if (!m) { App.state.selectedMatch = null; refreshAll(); return; }

  const back = el('button', 'btn btn-ghost', '← Назад');
  back.style.marginBottom = '12px';
  back.addEventListener('click', () => { App.state.selectedMatch = null; refreshAll(); });
  frag.appendChild(back);

  const wrap = el('div', 'detail-wrap fade-in');
  const hdr = el('div', 'detail-toolbar');
  hdr.innerHTML = '<span><b>' + m.leagueIcon + ' ' + esc(m.league) + '</b></span>' +
    (m.status === 'live'
      ? '<span class="live-badge">LIVE ' + Math.floor(m.minute) + "'</span>"
      : '<span>🕒 ' + (m.status === 'upcoming' ? m.time : 'Завершён') + '</span>');
  wrap.appendChild(hdr);

  // Счёт / таймер
  const sl = el('div', 'scoreline');
  const icon = m.sport === 'football' ? '⚽' : m.sport === 'hockey' ? '🏒' : m.sport === 'tennis' ? '🎾' : m.sport === 'ufc' ? '🥊' : '🎮';
  sl.innerHTML =
    '<div class="team"><span class="flag">' + icon + '</span>' + esc(m.a) + '</div>' +
    '<div class="divider">' + (m.status === 'live' ? 'LIVE' : '—') + '</div>' +
    '<div class="sc">' + m.sA + ' : ' + m.sB + '</div>' +
    '<div class="divider">' + (m.status === 'live' ? Math.floor(m.minute) + "'" : '') + '</div>' +
    '<div class="team"><span class="flag">' + icon + '</span>' + esc(m.b) + '</div>';
  wrap.appendChild(sl);

  if (m.status === 'live') {
    const pr = el('div', 'live-scoreboard', '');
    const progress = el('div', 'progress');
    const fill = el('div', 'progress-fill');
    fill.style.width = Math.min(100, (m.minute / m.maxMinute) * 100) + '%';
    progress.appendChild(fill);
    pr.appendChild(progress);
    wrap.appendChild(pr);

    // лента событий
    const tl = el('div', 'timeline');
    const evs = [...m.events].reverse();
    if (evs.length === 0) tl.appendChild(el('div', 'win-note', 'Идёт разминка...'));
    evs.forEach(e => {
      const side = e.team === 'a' ? 'tl-a' : '';
      const it = el('div', 'timeline-item ' + side);
      const txt = '<span class="txt' + (e.team === 'a' ? ' r' : '') + '">' + 
        (e.type === 'goal' ? '<span class="tag-goal">' + esc(e.label) + '!</span> ' : '') +
        esc(e.player) + '</span>';
      it.innerHTML = e.team === 'a'
        ? '<span class="min">' + e.min + "'</span>" + txt
        : txt + '<span class="min">' + e.min + "'</span>";
      tl.appendChild(it);
    });
    wrap.appendChild(tl);
  } else {
    wrap.appendChild(el('div', 'panel-note',
      m.status === 'upcoming'
        ? 'Матч начнётся автоматически. Следите за LIVE-обновлениями.'
        : 'Матч завершён. Ставки рассчитаны.'));
  }

  // Табы
  const tabs = el('div', 'tabs-lg');
  const t1 = el('button', 'Обзор');
  const t2 = el('button', 'Котировки');
  t1.classList.toggle('active', App.state.matchTab !== 'markets');
  t2.classList.toggle('active', App.state.matchTab === 'markets');
  tabs.appendChild(t1); tabs.appendChild(t2);
  wrap.appendChild(tabs);

  const mkBody = el('div', 'markets');
  const od = m.status === 'live' ? m.liveOdds : m.odds;

  function renderCurrent() {
    mkBody.innerHTML = '';
    if (App.state.matchTab === 'markets') renderMarketsDetail(m, od, mkBody);
    else renderOverview(m, mkBody);
  }
  t1.addEventListener('click', () => { App.state.matchTab = 'overview'; renderCurrent(); });
  t2.addEventListener('click', () => { App.state.matchTab = 'markets'; renderCurrent(); });

  renderCurrent();
  wrap.appendChild(mkBody);
  frag.appendChild(wrap);
}

function renderOverview(m, target) {
  // Основной исход
  target.appendChild(el('div', 'market-title', 'Основной исход'));
  const names = m.sport === 'tennis' || m.sport === 'ufc' || m.sport === 'esports'
    ? { '1': 'Победа ' + m.a, '2': 'Победа ' + m.b }
    : { '1': 'Победа ' + m.a, 'X': 'Ничья', '2': 'Победа ' + m.b };
  const mk = mainMarkets(m.sport);
  const row = el('div', 'market-row');
  mk.forEach(x => {
    const od = m.status === 'live' ? m.liveOdds : m.odds;
    if (od[x.key] == null) return;
    row.appendChild(el('span', 'name', esc(names[x.key])));
    row.appendChild(coefButton(m, x.key, od[x.key], names[x.key]));
  });
  target.appendChild(row);

  // Статистика
  const stats = el('div', 'stat-grid');
  target.appendChild(stats);

  const card1 = el('div', 'stat-card');
  card1.appendChild(el('h3', '', 'Владение'));
  const bars = el('div', 'stat-bars');
  const pa = Math.max(20, Math.min(80, Math.round(50 + (m.strA - m.strB) * 0.15)));
  const pb = 100 - pa;
  bars.innerHTML =
    '<div class="stat-row"><span class="label">' + esc(m.a) + '</span><div class="bar"><div class="a" style="width:' + pa + '%"></div></div><span class="label">' + pa + '%</span></div>' +
    '<div class="stat-row"><span class="label">' + esc(m.b) + '</span><div class="bar"><div class="b" style="width:' + pb + '%"></div></div><span class="label">' + pb + '%</span></div>';
  card1.appendChild(bars);
  stats.appendChild(card1);

  const card2 = el('div', 'stat-card');
  card2.appendChild(el('h3', '', 'Удары по воротам'));
  const su = el('div', 'stat-bars');
  const sa = Math.round((3 + m.sA * 6) + (m.strA / 20) * Math.random());
  const sb = Math.round((3 + m.sB * 6) + (m.strB / 20) * Math.random());
  su.innerHTML =
    '<div class="stat-row"><span class="label">' + esc(m.a) + '</span><div class="bar"><div class="a" style="width:' + Math.min(100, sa * 4) + '%"></div></div><span class="label">' + sa + '</span></div>' +
    '<div class="stat-row"><span class="label">' + esc(m.b) + '</span><div class="bar"><div class="b" style="width:' + Math.min(100, sb * 4) + '%"></div></div><span class="label">' + sb + '</span></div>';
  card2.appendChild(su);
  stats.appendChild(card2);
}

function renderMarketsDetail(m, od, target) {
  target.appendChild(el('div', 'market-title', 'Основной исход'));
  const names = m.sport === 'tennis' || m.sport === 'ufc' || m.sport === 'esports'
    ? { '1': 'Победа ' + m.a, '2': 'Победа ' + m.b }
    : { '1': 'Победа ' + m.a, 'X': 'Ничья', '2': 'Победа ' + m.b };
  const mk = mainMarkets(m.sport);
  const row = el('div', 'market-row');
  mk.forEach(x => {
    if (od[x.key] == null) return;
    row.appendChild(el('span', 'name', esc(names[x.key])));
    row.appendChild(coefButton(m, x.key, od[x.key], names[x.key]));
  });
  target.appendChild(row);

  const marketRows = [
    ['Тоталы', [['TB2.5', 'Тотал больше 2.5'], ['TM2.5', 'Тотал меньше 2.5'], ['TB1.5', 'Тотал больше 1.5'], ['TM1.5', 'Тотал меньше 1.5']]],
    ['Форы', [['Ф1(-1)', 'Ф1 (-1)'], ['Ф2(+1)', 'Ф2 (+1)']]],
  ];
  marketRows.forEach(([title, entries]) => {
    target.appendChild(el('div', 'market-title', title));
    entries.forEach(([key, label]) => {
      if (od[key] == null) return;
      const r = el('div', 'market-row');
      r.appendChild(el('span', 'name', esc(label)));
      r.appendChild(coefButton(m, key, od[key], label));
      target.appendChild(r);
    });
  });
}

/* ---------- РЕЗУЛЬТАТЫ ---------- */
function renderResults(frag) {
  const fin = App.matches.filter(m => m.status === 'finished');
  const section = el('div', 'section');
  section.appendChild(el('div', 'section-head', 'Результаты <span class="more">' + fin.length + '</span>'));

  if (fin.length === 0) {
    section.appendChild(el('div', 'empty', '<span class="emo">🏁</span>Пока нет завершённых матчей. Ждите финалов в LIVE.'));
  } else {
    const list = el('div', 'match-list');
    [...fin].reverse().slice(0, 50).forEach(m => {
      const r = el('div', 'result-row fade-in');
      const winner = m.sA > m.sB ? m.a : m.sB > m.sA ? m.b : 'Ничья';
      r.innerHTML =
        '<div class="teams">' + esc(m.a) + ' — ' + esc(m.b) + '</div>' +
        '<div><span class="win-tag">' + esc(winner) + '</span></div>' +
        '<div class="res">' + m.sA + ' : ' + m.sB + '</div>';
      list.appendChild(r);
    });
    section.appendChild(list);
  }
  frag.appendChild(section);
}

/* ---------- ПРОФИЛЬ ---------- */
function toggleProfile() {
  if (!App.user) { openAuth(); return; }
  renderProfile();
  App.el.overlay.hidden = false;
  App.el.profileModal.hidden = false;
  document.querySelector('.coupon-wrap').style.display = 'none';
}

function openAuth() {
  App.el.overlay.hidden = false;
  App.el.authModal.hidden = false;
  document.querySelector('.coupon-wrap').style.display = 'none';
}

function renderProfile() {
  const u = App.user;
  const st = u.stats || { totalBet: 0, won: 0, lost: 0, profit: 0 };
  const body = App.el.profileBody;
  body.innerHTML = '';

  const hero = el('div', 'profile-hero');
  hero.innerHTML =
    '<div class="avatar">👤</div><div class="p-name">' + esc(u.login) + '</div>' +
    '<div class="p-id">ID: ' + u.id + '</div>' +
    '<div class="stat-pills">' +
      '<div class="stat-pill"><span class="n">' + fmtMoney(u.balance) + '</span><span class="l">Баланс</span></div>' +
      '<div class="stat-pill"><span class="n">' + st.won + '</span><span class="l">Выиграно</span></div>' +
      '<div class="stat-pill"><span class="n">' + st.lost + '</span><span class="l">Проиграно</span></div>' +
      '<div class="stat-pill"><span class="n">' + (st.profit > 0 ? '+' : '') + fmtMoney(st.profit) + '</span><span class="l">Прибыль</span></div>' +
    '</div>';
  body.appendChild(hero);

  const grid = el('div', 'profile-grid');

  const hist = el('div', 'profile-card');
  hist.appendChild(el('h3', '', 'История ставок'));
  const list = el('div', 'bets-list');
  if ((u.bets || []).length === 0) {
    list.appendChild(el('div', 'win-note', 'Ставок пока нет'));
  } else {
    u.bets.slice(0, 30).forEach(b => {
      const row = el('div', 'bet-row');
      const tag = b.status === 'won' ? 'st-win' : b.status === 'lost' ? 'st-lose' : 'st-wait';
      const tagTxt = b.status === 'won' ? 'Выигрыш' : b.status === 'lost' ? 'Проигрыш' : 'Ожидает';
      const payHtml = b.status === 'won' ? '<span class="pay">+' + fmtMoney(b.pay - b.stake) + '</span>'
        : b.status === 'lost' ? '<span class="pay" style="color:var(--danger)">-' + fmtMoney(b.stake) + '</span>' : '';
      row.innerHTML =
        '<div class="top"><span class="stk">' + (b.type === 'express' ? 'Экспресс' : 'Одиночная') + ': <b>' + fmtMoney(b.stake) + '</b></span>' +
        '<span class="status-tag ' + tag + '">' + tagTxt + '</span></div>' +
        '<div class="meta">' + b.legs.map(l =>
          esc(l.match) + ' • ' + esc(l.label) + ' (' + l.coef.toFixed(2) + ')').join('<br>') + '</div>' +
        '<div class="meta">Коэф: <b>' + b.coef.toFixed(2) + '</b> ' + payHtml + '</div>';
      list.appendChild(row);
    });
  }
  hist.appendChild(list);
  grid.appendChild(hist);

  const wallet = el('div', 'profile-card');
  wallet.appendChild(el('h3', '', 'Кошелёк'));
  const kv = el('div', '');
  kv.innerHTML =
    '<div class="kv"><span class="k">Текущий баланс</span><span class="v up">' + fmtMoney(u.balance) + '</span></div>' +
    '<div class="kv"><span class="k">Получено сегодня</span><span class="v">' + fmtMoney(u.dailyAdded || 0) + '</span></div>' +
    '<div class="kv"><span class="k">Потрачено на ставки</span><span class="v">' + fmtMoney(st.totalBet) + '</span></div>' +
    '<div class="kv"><span class="k">Ежедневная выплата</span><span class="v">+' + fmtMoney(DAILY_BONUS) + '</span></div>';
  wallet.appendChild(kv);
  const dep = el('button', 'btn gold w100', '⬆ Пополнить (+' + fmtMoney(DAILY_BONUS) + ')');
  dep.style.marginTop = '14px';
  dep.addEventListener('click', () => {
    const res = tryDailyDeposit(App.user);
    toast(res ? '+200 000 ₽ начислено' : 'Выплата уже начислена сегодня', res ? 'ok' : 'err');
    refreshHeader();
    renderProfile();
  });
  wallet.appendChild(dep);
  grid.appendChild(wallet);

  body.appendChild(grid);
}

/* ---------- ТОСТЫ ---------- */
function toast(msg, type) {
  const t = el('div', 'toast ' + (type || ''), esc(msg));
  App.el.toasts.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- ЦИКЛ LIVE ---------- */
function startLoop() {
  setInterval(() => {
    tickLive(App.matches);

    // Расчёт завершённых ставок
    if (App.user) {
      const settled = settleBets(App.user, App.matches);
      if (settled.length) {
        settled.forEach(b => toast(
          b.status === 'won'
            ? '🎉 Ставка выиграна! +' + fmtMoney(b.pay) + ' (' + b.type + ')'
            : 'Ставка проиграна (' + b.type + ')', b.status === 'won' ? 'ok' : 'err'));
        refreshHeader();
        if (!App.el.profileModal.hidden) renderProfile();
      }
    }

    // Уведомления о событиях
    App.matches.forEach(m => {
      if (m.status === 'live' && m.events.length) {
        const last = m.events[m.events.length - 1];
        if (!last._ts) {
          last._ts = Date.now();
          toast(eventText(last, m), 'goal');
        }
      }
    });

    if (App.matches.some(m => m.status === 'finished')) {
      // результаты появились — обновим вкладку
    }

    refreshHeader();
    refreshAll();
  }, 1200);
}