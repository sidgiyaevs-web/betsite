'use strict';

/* ================= ХРАНИЛИЩЕ: АККАУНТЫ, БАЛАНС, СТАВКИ ================= */

const DB_KEY = 'lz_users_v1';
const SESSION_KEY = 'lz_session_v1';
const DAILY_BONUS = 200000;   // автопополнение в день
const START_BALANCE = 5000;

const DB = {
  load() {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || { users: [], seq: 1 }; }
    catch (e) { return { users: [], seq: 1 }; }
  },
  save(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); },

  users() { return this.load().users; },

  findUser(login) {
    const l = String(login).trim().toLowerCase();
    return this.users().find(u => u.login.toLowerCase() === l);
  },

  register(login, pass) {
    const db = this.load();
    const l = String(login).trim().toLowerCase();
    if (!l || String(pass).length < 4) return { err: 'Логин обязателен, пароль — минимум 4 символа' };
    if (db.users.some(u => u.login.toLowerCase() === l)) return { err: 'Такой логин уже занят' };
    const user = {
      id: db.seq++,
      login: String(login).trim(),
      pass: String(pass),
      balance: START_BALANCE,
      bonusDate: '2000-01-01', // вчера-навсегда: разовый депозит при первом входе
      bets: [],
      createdAt: Date.now(),
      stats: { totalBet: 0, won: 0, lost: 0, profit: 0 },
    };
    db.users.push(user);
    this.save(db);
    return { user };
  },

  creditDaily(user) {
    if (user.bonusDate !== todayKey()) {
      user.balance += DAILY_BONUS;
      user.bonusDate = todayKey();
      user.dailyAdded = DAILY_BONUS;
      this.updateUser(user);
      return true;
    }
    return false;
  },

  updateUser(user) {
    const db = this.load();
    const i = db.users.findIndex(u => u.id === user.id);
    if (i >= 0) db.users[i] = user;
    this.save(db);
  },

  getOrCreateGuest() {
    return {
      id: 0,
      login: 'Гость',
      balance: START_BALANCE,
      bonusDate: todayKey(),
      bets: [],
      stats: { totalBet: 0, won: 0, lost: 0, profit: 0 },
    };
  },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const Session = {
  get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } },
  set(userId) { localStorage.setItem(SESSION_KEY, JSON.stringify({ userId })); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

/* Активный пользователь: из сессии, либо гость */
function activeUser() {
  const s = Session.get();
  if (s && s.userId) {
    const u = DB.users().find(x => x.id === s.userId);
    if (u) return u;
  }
  return null; // не авторизован
}

/* Депозит: ежедневное пополнение. Возвращает true, если деньги начислены. */
function tryDailyDeposit(user) {
  return DB.creditDaily(user);
}

/* ---------- СТАВКИ ---------- */

function addBet(user, bet) {
  bet.id = 'b' + Date.now() + Math.floor(Math.random() * 1000);
  bet.placeTime = Date.now();
  user.bets.unshift(bet);
  user.balance -= bet.stake;
  user.stats.totalBet += bet.stake;
  DB.updateUser(user);
}

/* Проверка не рассчитанных ставок. Возвращает массив обновлённых, и мутирует юзера. */
function settleBets(user, matches) {
  const settled = [];
  if (!user.bets) return settled;
  const idx = matches.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});

  user.bets.forEach(bet => {
    if (bet.status !== 'open') return;
    const pending = bet.legs.filter(leg => !leg.settled);
    let allSettled = true;
    let win = true;
    let totalCoeff = 1;

    bet.legs.forEach(leg => {
      if (leg.settled) {
        totalCoeff *= leg.coef;
        if (!leg.won) win = false;
        return;
      }
      const m = idx[leg.matchId];
      if (!m || m.status !== 'finished') { allSettled = false; return; }

      // решаем исход
      leg.settled = true;
      leg.result = resultFor(m, leg.market);
      leg.won = leg.result === 'win';
      if (!leg.won) win = false;
      totalCoeff *= leg.coef;
    });

    if (allSettled) {
      bet.status = win ? 'won' : 'lost';
      bet.settledAt = Date.now();
      if (win) {
        const pay = Math.round(bet.stake * bet.coef);
        user.balance += pay;
        user.stats.won += 1;
        user.stats.profit += (pay - bet.stake);
        bet.pay = pay;
      } else {
        user.stats.lost += 1;
        user.stats.profit -= bet.stake;
        bet.pay = 0;
      }
      settled.push(bet);
    }
  });

  if (settled.length) DB.updateUser(user);
  return settled;
}

/* Исход маркета по матчу: 'win' | 'lose' */
function resultFor(m, market) {
  const goalsA = m.sA, goalsB = m.sB;

  if (market === '1') return goalsA > goalsB ? 'win' : 'lose';
  if (market === '2') return goalsB > goalsA ? 'win' : 'lose';
  if (market === 'X') return goalsA === goalsB ? 'win' : 'lose';

  if (market === 'TB2.5') return (goalsA + goalsB) > 2.5 ? 'win' : 'lose';
  if (market === 'TM2.5') return (goalsA + goalsB) < 2.5 ? 'win' : 'lose';
  if (market === 'TB1.5') return (goalsA + goalsB) > 1.5 ? 'win' : 'lose';
  if (market === 'TM1.5') return (goalsA + goalsB) < 1.5 ? 'win' : 'lose';

  if (market === 'Ф1(-1)') return (goalsA - 1) > goalsB ? 'win' : 'lose';
  if (market === 'Ф2(+1)') return (goalsB + 1) > goalsA ? 'win' : 'lose';

  // для тенниса/ufc/кибер — без ничьей, чистые 1/2
  if (market.includes('1')) return goalsA > goalsB ? 'win' : 'lose';
  if (market.includes('2')) return goalsB > goalsA ? 'win' : 'lose';
  return 'lose';
}

function fmtMoney(n) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₽';
}