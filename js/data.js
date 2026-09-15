'use strict';

/* ================= ДАННЫЕ: СПОРТЫ, ЛИГИ, КОМАНДЫ, МАТЧИ ================= */

const SPORTS = {
  football: { id: 'football', name: 'Футбол', icon: '⚽' },
  hockey:   { id: 'hockey',   name: 'Хоккей', icon: '🏒' },
  tennis:   { id: 'tennis',   name: 'Теннис', icon: '🎾' },
  ufc:      { id: 'ufc',      name: 'UFC / MMA', icon: '🥊' },
  esports:  { id: 'esports',  name: 'Киберспорт', icon: '🎮' },
};

/* Лиги с командами и средними силами (сила — условный рейтинг для симуляции) */
const LEAGUES = [
  {
    sport: 'football', name: 'Английская Премьер-лига', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    teams: [
      ['Ман Сити', 92], ['Арсенал', 88], ['Ливерпуль', 86], ['Челси', 82],
      ['Ман Юнайтед', 80], ['Тоттенхэм', 79], ['Ньюкасл', 78], ['Астон Вилла', 76],
      ['Брайтон', 72], ['Вест Хэм', 70], ['Эвертон', 66], ['Фулхэм', 65],
      ['Кристал Пэлас', 64], ['Брентфорд', 63], ['Вулверхэмптон', 61], ['Лестер', 60],
      ['Ноттингем Форест', 59], ['Саутгемптон', 57], ['Ипсвич', 55], ['Лутон', 54],
    ],
  },
  {
    sport: 'football', name: 'Испанская Ла Лига', icon: '🇪🇸',
    teams: [
      ['Реал Мадрид', 90], ['Барселона', 87], ['Атлетико', 83], ['Атлетик Бильбао', 77],
      ['Реал Сосьедад', 75], ['Вильярреал', 74], ['Бетис', 70], ['Валенсия', 68],
      ['Севилья', 67], ['Жирона', 66], ['Осасуна', 62], ['Хетафе', 60],
      ['Сельта', 59], ['Мальорка', 58], ['Алавес', 56], ['Райо Вальекано', 55],
    ],
  },
  {
    sport: 'football', name: 'Итальянская Серия А', icon: '🇮🇹',
    teams: [
      ['Интер', 88], ['Ювентус', 85], ['Милан', 84], ['Наполи', 82],
      ['Аталанта', 81], ['Рома', 78], ['Лацио', 76], ['Фиорентина', 75],
      ['Болонья', 73], ['Торино', 70], ['Удинезе', 67], ['Дженоа', 65],
      ['Верона', 60], ['Лечче', 58], ['Парма', 57], ['Комо', 55],
    ],
  },
  {
    sport: 'football', name: 'Российская Премьер-лига', icon: '🇷🇺',
    teams: [
      ['Зенит', 84], ['Краснодар', 82], ['Спартак', 80], ['ЦСКА', 79],
      ['Динамо', 78], ['Локомотив', 77], ['Ростов', 72], ['Крылья Советов', 68],
      ['Ахмат', 66], ['Рубин', 65], ['Пари НН', 62], ['Оренбург', 60],
      ['Урал', 58], ['Факел', 56], ['Химки', 54], ['Торпедо', 52],
    ],
  },
  {
    sport: 'football', name: 'Лига Чемпионов УЕФА', icon: '🏆',
    teams: [
      ['Реал Мадрид', 91], ['Ман Сити', 92], ['Бавария', 89], ['ПСЖ', 88],
      ['Арсенал', 88], ['Ливерпуль', 86], ['Интер', 86], ['Барселона', 87],
      ['Боруссия Дортмунд', 80], ['Атлетико', 83], ['Лейпциг', 78], ['Наполи', 82],
    ],
  },
  {
    sport: 'hockey', name: 'Континентальная хоккейная лига', icon: '🏆',
    teams: [
      ['СКА', 86], ['ЦСКА', 85], ['Ак Барс', 84], ['Металлург Мг', 83],
      ['Динамо М', 81], ['Локомотив Яр', 80], ['Авангард', 79], ['Салават Юлаев', 78],
      ['Трактор', 76], ['Спартак М', 75], ['Торпедо НН', 73], ['Северсталь', 71],
      ['Барыс', 68], ['Лада', 64], ['Витязь', 62], ['Амур', 60],
    ],
  },
  {
    sport: 'hockey', name: 'NHL', icon: '🇺🇸',
    teams: [
      ['Эдмонтон', 88], ['Флорида Пантерз', 87], ['Колорадо', 86], ['Ванкувер', 83],
      ['Даллас', 82], ['Нью-Йорк Рейнджерс', 82], ['Торонто', 81], ['Бостон', 80],
      ['Вегас', 79], ['Каролина', 79], ['Тампа-Бэй', 78], ['Питтсбург', 74],
      ['Вашингтон', 73], ['Айлендерс', 71], ['Баффало', 66], ['Анахайм', 62],
    ],
  },
  {
    sport: 'tennis', name: 'ATP — Мировой тур', icon: '🏆',
    mode: 'tennis',
    players: [
      ['Синнер', 95], ['Алькарас', 92], ['Джокович', 93], ['Медведев', 88],
      ['Зверев', 85], ['Рублёв', 84], ['Хуркач', 80], ['Пол', 79],
      ['Фритц', 80], ['Циципас', 78], ['Рун', 76], ['Шелтон', 74],
      ['Димитров', 73], ['Баутиста Агут', 69], ['Фучович', 66], ['Штруфф', 68],
    ],
  },
  {
    sport: 'tennis', name: 'WTA — Женский тур', icon: '🏆',
    mode: 'tennis',
    players: [
      ['Свёнтек', 94], ['Сабалёнка', 92], ['Гауфф', 89], ['Рыбакина', 88],
      ['Пегула', 83], ['Крейчикова', 81], ['Остапенко', 78],
      ['Андреева', 77], ['Касаткина', 75], ['Калинская', 73], ['Шнайдер', 72],
    ],
  },
  {
    sport: 'ufc', name: 'UFC Fight Night', icon: '🇺🇸',
    mode: 'ufc',
    fighters: [
      ['Ислам Махачев', 96], ['Арман Царукян', 90],
      ['Алекс Перейра', 92], ['Магомед Анкалаев', 89],
      ['Илия Топурия', 91], ['Макс Холлоуэй', 86],
      ['Шон Стрикленд', 84], ['Дрикус дю Плесси', 85],
      ['Исраэль Адесанья', 83], ['Нассурдин Имавов', 80],
      ['Александр Волков', 82], ['Сергей Павлович', 79],
      ['Пётр Ян', 81], ['Дейвисон Фигейреду', 78],
      ['Хамзат Чимаев', 88], ['Камру Усман', 82],
    ],
  },
  {
    sport: 'esports', name: 'CS2 — BLAST Premier', icon: '⌨️',
    mode: 'esports',
    teams: [
      ['NaVi', 90], ['FaZe', 88], ['Team Spirit', 87], ['G2', 86],
      ['Virtus.pro', 85], ['Vitality', 84], ['MOUZ', 82], ['Astralis', 78],
      ['Heroic', 76], ['Complexity', 74], ['Furia', 73], ['Liquid', 75],
    ],
  },
  {
    sport: 'esports', name: 'Dota 2 — DreamLeague', icon: '🎮',
    mode: 'esports',
    teams: [
      ['Team Spirit', 92], ['O.G.', 85], ['Virtus.pro', 86], ['Team Liquid', 87],
      ['BetBoom', 83], ['LGD', 81], ['Tundra', 80],
      ['9Pandas', 78], ['XG', 77], ['Aurora', 76], ['Entity', 74],
    ],
  },
  {
    sport: 'esports', name: 'League of Legends — EMEA', icon: '🎮',
    mode: 'esports',
    teams: [
      ['G2 Esports', 88], ['KOI', 85], ['Fnatic', 84], ['MAD Lions', 82],
      ['SK Gaming', 78], ['Team Heretics', 77], ['GIANTX', 75], ['Rogue', 74],
    ],
  },
];

/* Формат времени старта: сегодня в разное время */
function pad(n) { return String(n).padStart(2, '0'); }

function startTime(offsetMin) {
  const d = new Date(Date.now() + offsetMin * 60000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function teamPair(list) {
  const t = [...list];
  t.sort(() => Math.random() - 0.5);
  const a = t.pop(), b = t.pop();
  return [a, b];
}

/* Создаём пул матчей. Статусы: upcoming (с разным стартом), live (часть) */
function buildMatches() {
  const matches = [];
  let id = 1;

  function push(sport, name, icon, leftLabel, rightLabel, lStrong, rStrong, startIn, status, extra) {
    const startOffset = status === 'live' ? Math.round(-Math.random() * 55) : startIn;
    const m = Object.assign({
      id: id++,
      sport,
      league: name,
      leagueIcon: icon,
      a: leftLabel,
      b: rightLabel,
      sA: 0,
      sB: 0,
      strA: lStrong,
      strB: rStrong,
      status,
      startOffset,
      minute: status === 'live' ? Math.round(Math.random() * 80) + 5 : 0,
      events: [],
      odds: null,   // 1, X, 2 плюс тоталы/форы
      liveOdds: null,
      time: startTime(startOffset),
      fav: false,
      finishedAt: null,
    }, extra || {});
    matches.push(m);
    return m;
  }

  LEAGUES.forEach(league => {
    let pairs;
    if (league.mode === 'tennis') {
      pairs = [];
      const p = [...league.players];
      p.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.floor(p.length / 2); i++) {
        const a = p.pop(), b = p.pop();
        pairs.push([a, b]);
      }
    } else if (league.mode === 'ufc') {
      pairs = [];
      const p = [...league.fighters];
      p.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.floor(p.length / 2); i++) {
        const a = p.pop(), b = p.pop();
        pairs.push([a, b]);
      }
    } else {
      pairs = [];
      const t = [...league.teams];
      t.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.floor(t.length / 2); i++) {
        const a = t.pop(), b = t.pop();
        pairs.push([a, b]);
      }
    }

    pairs.forEach((pair, idx) => {
      const status = idx === 0 || idx === 6 ? 'live' : 'upcoming';
      const startIn = Math.round(Math.random() * 180) + 20;
      push(
        league.sport, league.name, league.icon,
        pair[0][0], pair[1][0],
        pair[0][1] || 50, pair[1][1] || 50,
        startIn, status
      );
    });
  });

  return matches;
}

/* Маркеты: расчёт кэфов по силе команд. Логистическая модель вероятностей исхода. */
function eWinProb(diff) {
  // diff = силаA - силаB; вероятность победы A (2-way)
  return 1 / (1 + Math.exp(-diff / 11));
}

function coeffFromWin(sA, sB, sport) {
  const d = sA - sB;
  const pDraw = clamp(0.28 - Math.abs(d) * 0.002, 0.16, 0.30);
  const w2 = eWinProb(d);
  const p1 = w2 * (1 - pDraw);
  const p2 = (1 - w2) * (1 - pDraw);
  const margin = 1.08;
  return {
    '1': clamp(margin / p1, 1.03, 30),
    'X': clamp(margin / pDraw, 2.5, 12),
    '2': clamp(margin / p2, 1.03, 30),
  };
}

/* Тоталы и форы считаются от силы разницы команд */
function totalsFromDiff(sA, sB) {
  const d = sA - sB;
  const m = 1.08;
  const pOver25 = clamp(0.5 + d * 0.001, 0.35, 0.65);
  const over25 = clamp(m / pOver25, 1.5, 3.2);
  const under25 = clamp(m / (1 - pOver25), 1.5, 3.2);
  const pOver15 = clamp(0.8 + d * 0.0005, 0.62, 0.94);
  const over15 = clamp(m / pOver15, 1.1, 1.8);
  const under15 = clamp(m / (1 - pOver15), 2.2, 5.5);
  // форы: фавориту фора -1 даёт кэф чуть выше победы
  const fd = clamp((Math.abs(d) >= 10 ? 1.35 : 1.65) - d * 0.004, 1.15, 2.8);
  return {
    'TB2.5': over25,
    'TM2.5': under25,
    'TB1.5': over15,
    'TM1.5': under15,
    'Ф1(-1)': clamp(fd, 1.2, 4.5),
    'Ф2(+1)': clamp(1.7 + d * 0.012, 1.2, 5.0),
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(v * 100) / 100)); }

/* Кэфы матча: 1X2 + тоталы/форы. Для тенниса/UFC/кибера ничьей нет. */
function oddsOf(m) {
  if (m.sport === 'football' || m.sport === 'hockey') {
    const b = coeffFromWin(m.strA, m.strB, m.sport);
    Object.assign(b, totalsFromDiff(m.strA, m.strB));
    return b;
  }
  // без ничьей (теннис/ufc/кибер)
  const p1 = eWinProb(m.strA - m.strB);
  const margin = 1.07;
  const k1 = clamp(margin / p1, 1.02, 25);
  const k2 = clamp(margin / (1 - p1), 1.02, 25);
  return {
    '1': k1,
    '2': k2,
    'X': null,
    'TB2.5': clamp(1.9 + (p1 - 0.5) * 0.6 + Math.random() * 0.2, 1.6, 2.4),
    'TM2.5': clamp(1.9 - (p1 - 0.5) * 0.6 + Math.random() * 0.2, 1.6, 2.4),
    'TB1.5': null,
    'TM1.5': null,
    'Ф1(-1)': k1 < 3.2 ? clamp(k1 * 0.82, 1.2, 4) : null,
    'Ф2(+1)': k2 < 3.2 ? clamp(k2 * 0.82, 1.2, 4) : null,
  };
}

/* Инициализация кэфов всех матчей */
function initAllOdds(matches) {
  matches.forEach(m => {
    m.odds = oddsOf(m);
    m.liveOdds = oddsOf(m);
    m.maxMinute = m.sport === 'football' ? 90 : m.sport === 'hockey' ? 60 : m.sport === 'tennis' ? 250 : m.sport === 'ufc' ? 15 : 40;
  });
}

/* Сохраняем сгенерированный пул в sessionStorage, чтобы при перезагрузке он не менялся резко */
const MATCHES_KEY = 'lz_matches_v1';

function loadOrBuildMatches() {
  try {
    const raw = sessionStorage.getItem(MATCHES_KEY);
    if (raw) { initAllOdds(JSON.parse(raw)); return JSON.parse(raw); }
  } catch (e) { /* ignore */ }
  const m = buildMatches();
  initAllOdds(m);
  try { sessionStorage.setItem(MATCHES_KEY, JSON.stringify(m)); } catch (e) { /* ignore */ }
  return m;
}