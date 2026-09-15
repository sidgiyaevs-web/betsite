'use strict';

/* ================= ДВИЖОК СИМУЛЯЦИИ LIVE ================= */

/* Начинаем матчи по расписанию, двигаем время, шумим кэфы, определяем исход. */

function tickLive(matches) {
  matches.forEach(m => {
    if (m.status === 'finished') return;

    // Запуск запланированных матчей
    if (m.status === 'upcoming') {
      m.startOffset -= 1; // ~1 сек реального = 1 мин "игрового" планирования; автостарт
      if (m.startOffset <= 0) {
        m.status = 'live';
        m.minute = 0;
        m.events = [];
      } else return;
    }

    // Движение времени
    const speed = m.sport === 'tennis' ? 4 : 1;
    m.minute += speed;

    // События
    if (m.minute % 2 === 0) maybeGoal(m);
    // Боковые события (карточки, замены) — реже
    if (m.sport === 'football' && m.minute % 13 === 0) sideEvent(m, 'card');
    if (m.sport === 'football' && m.minute % 17 === 0) sideEvent(m, 'sub');

    // Обновление кэфов (шум)
    m.liveOdds = jitterOdds(m);

    // Завершение
    if (m.minute >= m.maxMinute) finishMatch(m);
  });

  replenishPool(matches);
}

function jitterOdds(m) {
  const base = m.liveOdds || m.odds;
  const out = {};
  // шум ±1,5% плюс сдвиг в сторону текущего счёта
  let driftA = (m.sA - m.sB) * 0.12;
  Object.keys(base).forEach(k => {
    if (base[k] == null) { out[k] = null; return; }
    let v = base[k];
    if (k === '1') v -= driftA;
    if (k === '2') v += driftA;
    if (k === 'X' && m.sport === 'football') v += Math.abs((m.sA + m.sB)) * 0.05;
    const noise = (Math.random() - 0.5) * 0.015;
    out[k] = clamp(v * (1 + noise), 1.02, 25);
  });
  return out;
}

function maybeGoal(m) {
  // вероятность события зависит от силы команд и стадии матча
  const timeRatio = m.minute / m.maxMinute;
  const baseP = m.sport === 'hockey' ? 0.14 : m.sport === 'football' ? 0.09 :
                m.sport === 'tennis' ? 0.20 : m.sport === 'ufc' ? 0.22 : 0.10;
  const p = Math.min(0.4, baseP * (0.5 + timeRatio));

  if (Math.random() < p) {
    // кто забивает: сила команд + случай
    const total = m.strA + m.strB;
    const role = Math.random() * total;
    const teamA = role < m.strA;
    let player;
    if (m.sport === 'tennis') {
      player = (teamA ? m.a : m.b);
    } else {
      player = teamA ? m.a : m.b;
    }
    if (teamA) m.sA++; else m.sB++;

    // событие для таймлайна
    const evType = m.sport === 'ufc' ? (Math.random() < 0.4 ? 'knockout' : 'round') :
                   m.sport === 'tennis' ? 'set' :
                   m.sport === 'esports' ? 'round' : 'goal';
    const ev = {
      min: Math.floor(m.minute),
      team: teamA ? 'a' : 'b',
      player,
      type: evType,
      icon: m.sport === 'hockey' ? 'puck' : m.sport === 'esports' ? 'round' : 'goal',
      label: typeLabel(evType, m.sport),
    };
    m.events.push(ev);
    return ev;
  }
  return null;
}

function sideEvent(m, type) {
  return null; // сюжетные украшения, можно расширять
}

function typeLabel(type, sport) {
  if (type === 'goal') return sport === 'hockey' ? 'Шайба' : 'ГОЛ';
  if (type === 'set') return 'Сет';
  if (type === 'knockout') return 'Нокаут';
  if (type === 'round') return sport === 'esports' ? 'Раунд' : 'Раунд';
  return 'Событие';
}

function finishMatch(m) {
  m.status = 'finished';
  m.finishedAt = Date.now();
  m.minute = m.maxMinute;
  // финальные кэфы
  m.liveOdds = m.odds;
}

/* Пополняем пул: когда завершившихся много, подмешиваем новые предстоящие матчи */
function replenishPool(matches) {
  const active = matches.filter(m => m.status !== 'finished').length;
  const target = 40;
  if (active >= target) return;

  const fresh = buildMatches().slice(0, target - active);
  fresh.forEach(m => {
    m.id = matches.reduce((mx, x) => Math.max(mx, x.id), 0) + 1;
    m.status = 'upcoming';
    m.startOffset = Math.round(Math.random() * 200) + 30;
    m.minute = 0;
    m.events = [];
    m.time = startTime(m.startOffset);
    initAllOdds([m]);
    matches.push(m);
  });
}

/* Повесить уведомление о LIVE-событии, если имеется активная вкладка */
function recentLiveEvents(events, sinceSec) {
  const threshold = Date.now() - sinceSec;
  return events.filter(e => e._ts && e._ts > threshold);
}

/* Prompt-модалка для всплывающих событий */
function eventText(ev, m) {
  const who = ev.team === 'a' ? m.a : m.b;
  if (ev.type === 'goal') return `${ev.min}' GOAL! — ${who}`;
  if (ev.type === 'set') return `Сет выигран: ${who}`;
  if (ev.type === 'knockout') return `Нокаут! ${who} побеждает ${ev.min}'`;
  return `${ev.min}' ${ev.label}: ${who}`;
}