/* ============================================================
   OpenBet — Real Betting Engine
   app.js — Часть 1: утилиты, данные, движок, кэфы
   ============================================================ */
'use strict';

/* ============ УТИЛИТЫ ============ */
var $ = function(id) { return document.getElementById(id); };
var rand = function(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };
var pick = function(a) { return a[rand(0, a.length - 1)]; };
var clamp = function(v, l, h) { return Math.max(l, Math.min(h, v)); };
var fmt = function(v) { return Math.round(v).toLocaleString('ru-RU'); };
var ft = function(s) { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
var todayKey = function() { return new Date().toISOString().slice(0, 10); };

var sIcon = function(s) {
  return s === 'football' ? '⚽' : s === 'hockey' ? '🏒' : s === 'volleyball' ? '🏐' : '🥊';
};
var sName = function(s) {
  return s === 'football' ? 'Футбол' : s === 'hockey' ? 'Хоккей' : s === 'volleyball' ? 'Волейбол' : 'UFC';
};

function teamColor(n) {
  var c = ['#e60023', '#00a854', '#2563eb', '#f0b400', '#7c5cff', '#ff6b6b', '#4ecdc4', '#3b82f6', '#ec4899', '#f59e0b'];
  var h = 0;
  for (var i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}
function teamInit(n) {
  var w = n.split(/\s+/);
  return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
}
function pickTwo(a) {
  var x = pick(a), y = pick(a), s = 0;
  while (x.n === y.n && s++ < 100) y = pick(a);
  return [x, y];
}
function poisson(k, l) {
  if (k < 0 || k > 25) return 0;
  if (l <= 0) return k === 0 ? 1 : 0;
  var lf = 0;
  for (var i = 2; i <= k; i++) lf += Math.log(i);
  return Math.exp(k * Math.log(l) - l - lf);
}
function normalCDF(z) {
  var t = 1 / (1 + 0.2316419 * Math.abs(z));
  var d = 0.3989423 * Math.exp(-z * z / 2);
  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/* Кэф с маржой 5% */
var MARGIN = 0.05;
function toOdd(p, m) {
  m = m === undefined ? MARGIN : m;
  if (p <= 0.03 || p >= 0.97) return null;
  var r = 1 / (p * (1 + m));
  if (r < 1.01 || r > 60) return null;
  return Math.ceil(r * 100) / 100;
}
var isValid = function(o) {
  return o !== null && o !== undefined && typeof o === 'number' && !isNaN(o) && o >= 1.01 && o <= 60;
};

/* ============ ФЛАГИ ============ */
var FLAGS = {ru:'🇷🇺',us:'🇺🇸',gb:'🇬🇧',es:'🇪🇸',de:'🇩🇪',it:'🇮🇹',fr:'🇫🇷',br:'🇧🇷',ca:'🇨🇦',am:'🇦🇲',nz:'🇳🇿',za:'🇿🇦',ng:'🇳🇬',au:'🇦🇺',cz:'🇨🇿',ae:'🇦🇪',kz:'🇰🇿',ge:'🇬🇪'};

/* ============ ДАННЫЕ ============ */
var FOOTBALL = [
  {n:'Manchester City',atk:2.10,def:0.90,lg:'Premier League',country:'gb',rt:93},
  {n:'Arsenal',atk:1.95,def:0.95,lg:'Premier League',country:'gb',rt:90},
  {n:'Liverpool',atk:2.05,def:1.00,lg:'Premier League',country:'gb',rt:91},
  {n:'Chelsea',atk:1.72,def:1.22,lg:'Premier League',country:'gb',rt:84},
  {n:'Tottenham',atk:1.80,def:1.30,lg:'Premier League',country:'gb',rt:82},
  {n:'Manchester United',atk:1.65,def:1.25,lg:'Premier League',country:'gb',rt:83},
  {n:'Newcastle',atk:1.75,def:1.20,lg:'Premier League',country:'gb',rt:81},
  {n:'Aston Villa',atk:1.68,def:1.28,lg:'Premier League',country:'gb',rt:80},
  {n:'Real Madrid',atk:2.20,def:0.90,lg:'La Liga',country:'es',rt:94},
  {n:'Barcelona',atk:2.10,def:1.05,lg:'La Liga',country:'es',rt:90},
  {n:'Atletico Madrid',atk:1.75,def:0.95,lg:'La Liga',country:'es',rt:86},
  {n:'Sevilla',atk:1.45,def:1.30,lg:'La Liga',country:'es',rt:78},
  {n:'Bayern Munich',atk:2.30,def:1.00,lg:'Bundesliga',country:'de',rt:93},
  {n:'Borussia Dortmund',atk:1.85,def:1.22,lg:'Bundesliga',country:'de',rt:84},
  {n:'Inter',atk:2.05,def:0.95,lg:'Serie A',country:'it',rt:89},
  {n:'Juventus',atk:1.70,def:0.98,lg:'Serie A',country:'it',rt:85},
  {n:'AC Milan',atk:1.88,def:1.15,lg:'Serie A',country:'it',rt:86},
  {n:'Napoli',atk:1.82,def:1.10,lg:'Serie A',country:'it',rt:85},
  {n:'Zenit',atk:1.90,def:1.05,lg:'RPL',country:'ru',rt:79},
  {n:'Krasnodar',atk:1.85,def:1.10,lg:'RPL',country:'ru',rt:78},
  {n:'CSKA Moscow',atk:1.60,def:1.20,lg:'RPL',country:'ru',rt:76},
  {n:'Spartak Moscow',atk:1.65,def:1.18,lg:'RPL',country:'ru',rt:76},
  {n:'Dinamo Moscow',atk:1.55,def:1.22,lg:'RPL',country:'ru',rt:75}
];

var HOCKEY = [
  {n:'Edmonton Oilers',atk:3.55,def:3.05,lg:'NHL',country:'ca',rt:90},
  {n:'Florida Panthers',atk:3.30,def:2.75,lg:'NHL',country:'us',rt:89},
  {n:'Boston Bruins',atk:3.15,def:2.65,lg:'NHL',country:'us',rt:88},
  {n:'Toronto Maple Leafs',atk:3.40,def:3.10,lg:'NHL',country:'ca',rt:87},
  {n:'Colorado Avalanche',atk:3.50,def:3.10,lg:'NHL',country:'us',rt:89},
  {n:'New York Rangers',atk:3.20,def:2.75,lg:'NHL',country:'us',rt:88},
  {n:'SKA',atk:3.40,def:2.70,lg:'KHL',country:'ru',rt:85},
  {n:'CSKA',atk:3.05,def:2.60,lg:'KHL',country:'ru',rt:84},
  {n:'Ak Bars',atk:3.10,def:2.70,lg:'KHL',country:'ru',rt:83},
  {n:'Dynamo Moscow',atk:3.15,def:2.80,lg:'KHL',country:'ru',rt:82}
];

var VOLLEYBALL = [
  {n:'Zenit Kazan',atk:1.35,serve:1.15,block:1.20,lg:'Суперлига',country:'ru',rt:92},
  {n:'Dynamo Moscow',atk:1.22,serve:1.08,block:1.12,lg:'Суперлига',country:'ru',rt:88},
  {n:'Belogorie',atk:1.12,serve:1.02,block:1.08,lg:'Суперлига',country:'ru',rt:85},
  {n:'Fakel',atk:1.00,serve:1.00,block:1.00,lg:'Суперлига',country:'ru',rt:82},
  {n:'Lokomotiv Novosibirsk',atk:0.92,serve:0.95,block:0.94,lg:'Суперлига',country:'ru',rt:80},
  {n:'Kuzbass',atk:0.85,serve:0.92,block:0.90,lg:'Суперлига',country:'ru',rt:78},
  {n:'Zenit SPb',atk:1.18,serve:1.05,block:1.10,lg:'Суперлига',country:'ru',rt:86}
];

var UFC = [
  {n:'Jon Jones',rt:2100,div:'Heavyweight',country:'us',style:'mixed',power:88,acc:92,td:95,hpMax:95,stamMax:85},
  {n:'Tom Aspinall',rt:2020,div:'Heavyweight',country:'gb',style:'striker',power:92,acc:85,td:70,hpMax:88,stamMax:80},
  {n:'Ciryl Gane',rt:1960,div:'Heavyweight',country:'fr',style:'striker',power:82,acc:88,td:60,hpMax:85,stamMax:82},
  {n:'Curtis Blaydes',rt:1930,div:'Heavyweight',country:'us',style:'grappler',power:80,acc:70,td:92,hpMax:90,stamMax:75},
  {n:'Alex Pereira',rt:2060,div:'Light Heavyweight',country:'br',style:'striker',power:96,acc:88,td:55,hpMax:88,stamMax:78},
  {n:'Magomed Ankalaev',rt:2010,div:'Light Heavyweight',country:'ru',style:'mixed',power:85,acc:82,td:88,hpMax:90,stamMax:85},
  {n:'Jiri Prochazka',rt:1960,div:'Light Heavyweight',country:'cz',style:'striker',power:88,acc:78,td:62,hpMax:82,stamMax:82},
  {n:'Dricus du Plessis',rt:2020,div:'Middleweight',country:'za',style:'mixed',power:85,acc:78,td:82,hpMax:92,stamMax:88},
  {n:'Israel Adesanya',rt:1980,div:'Middleweight',country:'nz',style:'striker',power:82,acc:92,td:60,hpMax:82,stamMax:85},
  {n:'Sean Strickland',rt:1950,div:'Middleweight',country:'us',style:'striker',power:75,acc:88,td:65,hpMax:88,stamMax:90},
  {n:'Khamzat Chimaev',rt:2010,div:'Middleweight',country:'ae',style:'grappler',power:82,acc:80,td:96,hpMax:88,stamMax:82},
  {n:'Islam Makhachev',rt:2070,div:'Lightweight',country:'ru',style:'grappler',power:80,acc:88,td:95,hpMax:88,stamMax:92},
  {n:'Arman Tsarukyan',rt:1990,div:'Lightweight',country:'am',style:'grappler',power:78,acc:85,td:88,hpMax:85,stamMax:88},
  {n:'Justin Gaethje',rt:1960,div:'Lightweight',country:'us',style:'striker',power:90,acc:82,td:65,hpMax:90,stamMax:82},
  {n:'Dustin Poirier',rt:1940,div:'Lightweight',country:'us',style:'mixed',power:85,acc:85,td:70,hpMax:88,stamMax:80},
  {n:'Charles Oliveira',rt:1975,div:'Lightweight',country:'br',style:'grappler',power:78,acc:82,td:90,hpMax:80,stamMax:82},
  {n:'Leon Edwards',rt:1990,div:'Welterweight',country:'gb',style:'mixed',power:78,acc:88,td:82,hpMax:85,stamMax:85},
  {n:'Kamaru Usman',rt:1950,div:'Welterweight',country:'ng',style:'grappler',power:82,acc:82,td:90,hpMax:90,stamMax:88},
  {n:'Ilia Topuria',rt:2030,div:'Featherweight',country:'es',style:'mixed',power:90,acc:85,td:82,hpMax:88,stamMax:85},
  {n:'Alexander Volkanovski',rt:2000,div:'Featherweight',country:'au',style:'mixed',power:80,acc:90,td:82,hpMax:88,stamMax:92},
  {n:'Max Holloway',rt:1985,div:'Featherweight',country:'us',style:'striker',power:78,acc:92,td:60,hpMax:90,stamMax:92},
  {n:'Sean O\'Malley',rt:1995,div:'Bantamweight',country:'us',style:'striker',power:85,acc:92,td:55,hpMax:82,stamMax:80},
  {n:'Merab Dvalishvili',rt:2005,div:'Bantamweight',country:'ge',style:'grappler',power:72,acc:82,td:96,hpMax:90,stamMax:95}
];

/* ============ STATE ============ */
var STATE = {
  screen: 'main',        // main | match
  currentSport: 'all',   // all | football | hockey | volleyball | ufc
  currentFilter: 'top',  // top | live
  currentMatch: null,    // объект матча на странице матча
  currentMarketTab: 'popular',
  currentStatParam: 'fouls',
  currentLine: {},
  matches: [],
  nextId: 1,
  soundOn: true,
  expandedLeagues: {},
  openMarkets: {},
  favorites: {},          // id -> true
  wallet: null
};

/* ============ WALLET ============ */
function initWallet() {
  try {
    var s = localStorage.getItem('openbet_wallet_v2');
    if (s) { STATE.wallet = JSON.parse(s); }
  } catch (e) {}
  if (!STATE.wallet) {
    STATE.wallet = {
      balance: 100000,
      lastReset: todayKey(),
      lastBonus: null,
      bets: [],
      totalBet: 0,
      totalWon: 0,
      sessionStart: 100000,
      profitHistory: [],
      coupon: []
    };
    saveWallet();
  }
}
function saveWallet() {
  try { localStorage.setItem('openbet_wallet_v2', JSON.stringify(STATE.wallet)); } catch (e) {}
}

/* ============ ЗВУКИ ============ */
var audioCtx = null;
function beep(f, d, t, v) {
  if (!STATE.soundOn) return;
  t = t || 'sine'; v = v || 0.08;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(v, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
  } catch (e) {}
}
function sBet() { beep(660, 0.08); }
function sWin() { beep(660, 0.12); setTimeout(function() { beep(880, 0.12); }, 120); setTimeout(function() { beep(1100, 0.2); }, 240); }
function sLose() { beep(220, 0.3, 'sawtooth', 0.05); }
function sBonus() { beep(880, 0.1); setTimeout(function() { beep(1100, 0.1); }, 100); setTimeout(function() { beep(1320, 0.15); }, 200); }
function vibe(ms) { if (navigator.vibrate) navigator.vibrate(ms || 10); }

/* ============ TOAST ============ */
function toast(type, icon, text) {
  var c = $('toastContainer'); if (!c) return;
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span style="font-size:18px">' + icon + '</span><span>' + text + '</span>';
  c.appendChild(el);
  setTimeout(function() {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(120%)';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }, 3200);
}

/* ============================================================
   ФУТБОЛ — 10 минут реальных = 90 игровых
   Перерыв 30 секунд
   Ситуативный движок с фазами
   ============================================================ */
var FT_TICK_PER_MIN = 6.67;    // 600 сек / 90 мин
var FT_BREAK_SEC = 30;

function newFootball() {
  var lgs = [];
  var seen = {};
  FOOTBALL.forEach(function(t) { if (!seen[t.lg]) { seen[t.lg] = 1; lgs.push(t.lg); } });
  var lg = pick(lgs);
  var teams = FOOTBALL.filter(function(t) { return t.lg === lg; });
  var pair = pickTwo(teams);
  var h = pair[0], a = pair[1];
  return {
    id: STATE.nextId++,
    sport: 'football', league: lg,
    home: h.n, away: a.n,
    homeAtk: h.atk, awayAtk: a.atk,
    homeDef: h.def, awayDef: a.def,
    homeRating: h.rt, awayRating: a.rt,
    homeCountry: h.country, awayCountry: a.country,
    scoreHome: 0, scoreAway: 0,
    minute: 0, maxMinute: 90,
    realTick: 0,
    phase: 'calm',
    phaseSecLeft: 15 + rand(0, 25),
    baseTempo: 0.75 + Math.random() * 0.65,
    weather: Math.random() < 0.8 ? 'good' : 'rain',
    // статистика
    xgHome: 0, xgAway: 0,
    shotsHome: 0, shotsAway: 0,
    shotsOnTargetHome: 0, shotsOnTargetAway: 0,
    goalKicksHome: 0, goalKicksAway: 0,
    throwInsHome: 0, throwInsAway: 0,
    foulsHome: 0, foulsAway: 0,
    cornersHome: 0, cornersAway: 0,
    possessionHome: 50,
    cardsHome: 0, cardsAway: 0,
    redHome: false, redAway: false,
    offsidesHome: 0, offsidesAway: 0,
    savesHome: 0, savesAway: 0,
    // таймеры следующих событий (игровые секунды)
    nextThrowIn: 60 + rand(0, 180),
    nextGoalKick: 80 + rand(0, 200),
    nextFoul: 90 + rand(0, 200),
    nextCorner: 300 + rand(0, 500),
    nextShot: 120 + rand(0, 240),
    nextOffside: 400 + rand(0, 700),
    half: 1,
    isBreak: false,
    breakTimer: 0,
    justScored: null,
    status: 'live',
    momentum: 0,
    commentary: 'Матч начинается · ' + (Math.random() < 0.8 ? 'хорошая погода' : 'дождь на поле')
  };
}

function computeFootballPhaseIntensity(m) {
  var phase = m.phase;
  var intensity = 1.0, goalBoost = 1.0;
  switch (phase) {
    case 'calm': intensity = 0.35; goalBoost = 0.5; break;
    case 'pressure_home': intensity = 1.7; goalBoost = 1.9; break;
    case 'pressure_away': intensity = 1.7; goalBoost = 1.9; break;
    case 'chaos': intensity = 2.6; goalBoost = 2.4; break;
    case 'endgame': intensity = 2.1; goalBoost = 1.7; break;
  }
  intensity *= m.baseTempo;
  if (m.weather === 'rain') intensity *= 1.1;
  if (m.minute >= 75 && phase !== 'endgame') { intensity *= 1.4; goalBoost *= 1.35; }
  if (Math.abs(m.scoreHome - m.scoreAway) <= 1 && m.minute > 70) { intensity *= 1.5; goalBoost *= 1.4; }
  if (Math.abs(m.scoreHome - m.scoreAway) >= 3) { intensity *= 1.15; goalBoost *= 0.7; }
  return { intensity: intensity, goalBoost: goalBoost };
}

function maybeSwitchFootballPhase(m) {
  m.phaseSecLeft -= 1;
  if (m.phaseSecLeft > 0) return;
  var roll = Math.random();
  var favorHome = (m.homeAtk - m.awayAtk) * 0.3;
  if (m.scoreHome > m.scoreAway) favorHome += 0.1;
  if (m.scoreAway > m.scoreHome) favorHome -= 0.1;
  favorHome = clamp(favorHome, -0.4, 0.4);
  var newPhase;
  if (m.minute >= 80) { newPhase = 'endgame'; m.phaseSecLeft = 999; }
  else if (roll < 0.30) { newPhase = 'calm'; m.phaseSecLeft = 18 + rand(0, 25); }
  else if (roll < 0.50 + favorHome) { newPhase = 'pressure_home'; m.phaseSecLeft = 15 + rand(0, 20); }
  else if (roll < 0.70 + favorHome) { newPhase = 'pressure_away'; m.phaseSecLeft = 15 + rand(0, 20); }
  else { newPhase = 'chaos'; m.phaseSecLeft = 12 + rand(0, 15); }
  if (m.redHome) newPhase = 'pressure_away';
  if (m.redAway) newPhase = 'pressure_home';
  m.phase = newPhase;
  if (newPhase === 'calm') m.commentary = 'Игра успокоилась · ' + Math.floor(m.minute) + "'";
  else if (newPhase === 'pressure_home') m.commentary = '🔥 ' + m.home + ' наращивает давление';
  else if (newPhase === 'pressure_away') m.commentary = '🔥 ' + m.away + ' наращивает давление';
  else if (newPhase === 'chaos') m.commentary = '⚡ Открытый футбол! Моменты у обоих ворот';
  else if (newPhase === 'endgame') m.commentary = '⏱ Финальный штурм!';
}

function footballExpectedLambda(m, side) {
  var base = side === 'home' ? m.homeAtk : m.awayAtk;
  var oppDef = side === 'home' ? m.awayDef : m.homeDef;
  var homeAdv = side === 'home' ? 1.20 : 0.90;
  var lambda = base * oppDef * homeAdv * 1.35;
  if (side === 'home' && m.redHome) lambda *= 0.35;
  if (side === 'away' && m.redAway) lambda *= 0.35;
  var mom = side === 'home' ? m.momentum : -m.momentum;
  lambda *= (1 + mom * 0.35);
  return Math.max(0.05, lambda);
}

function simulateFootballTick(m) {
  if (m.isBreak) {
    m.breakTimer += 1;
    if (m.breakTimer >= FT_BREAK_SEC) {
      m.isBreak = false;
      m.half = 2;
      m.minute = 45;
      m.commentary = '⚽ Второй тайм начался!';
    }
    return;
  }

  m.realTick += 1;
  m.minute += 1 / FT_TICK_PER_MIN;
  m.justScored = null;

  if (m.minute >= 45 && m.half === 1) {
    m.minute = 45;
    m.isBreak = true;
    m.breakTimer = 0;
    m.commentary = '⏸ Перерыв. Счёт: ' + m.scoreHome + ':' + m.scoreAway;
    return;
  }
  if (m.minute >= 90) {
    m.minute = 90;
    m.status = 'finished';
    m.finishedAt = Date.now();
    m.commentary = '🏁 Матч завершён: ' + m.scoreHome + ':' + m.scoreAway;
    return;
  }

  maybeSwitchFootballPhase(m);
  var I = computeFootballPhaseIntensity(m);
  var intensity = I.intensity;
  var goalBoost = I.goalBoost;

  m.nextThrowIn -= intensity * 1.5;
  if (m.nextThrowIn <= 0) {
    var s1 = Math.random() < 0.5 ? 'home' : 'away';
    if (s1 === 'home') m.throwInsHome++; else m.throwInsAway++;
    if (Math.random() < 0.35) m.nextThrowIn = 8 + rand(0, 25);
    else m.nextThrowIn = 60 + rand(0, 180);
  }
  m.nextGoalKick -= intensity;
  if (m.nextGoalKick <= 0) {
    var s2 = Math.random() < 0.5 ? 'home' : 'away';
    if (s2 === 'home') m.goalKicksHome++; else m.goalKicksAway++;
    m.nextGoalKick = 90 + rand(0, 240);
  }
  m.nextFoul -= intensity * 1.3;
  if (m.nextFoul <= 0) {
    var s3 = Math.random() < 0.5 ? 'home' : 'away';
    if (s3 === 'home') m.foulsHome++; else m.foulsAway++;
    if (Math.random() < 0.10) {
      if (s3 === 'home') m.cardsHome++; else m.cardsAway++;
      m.commentary = '🟨 Жёлтая — ' + (s3 === 'home' ? m.home : m.away) + ' · ' + Math.floor(m.minute) + "'";
    }
    if (Math.random() < 0.4) m.nextFoul = 15 + rand(0, 40);
    else m.nextFoul = 100 + rand(0, 240);
  }
  m.nextCorner -= intensity;
  if (m.nextCorner <= 0) {
    var s4 = Math.random() < 0.5 ? 'home' : 'away';
    if (s4 === 'home') m.cornersHome++; else m.cornersAway++;
    m.nextCorner = 200 + rand(0, 400);
  }
  m.nextShot -= intensity * 1.4;
  if (m.nextShot <= 0) {
    var s5 = Math.random() < 0.5 ? 'home' : 'away';
    var onT = Math.random() < 0.4;
    if (s5 === 'home') {
      m.shotsHome++;
      m.xgHome += 0.05 + Math.random() * 0.2;
      if (onT) { m.shotsOnTargetHome++; if (Math.random() < 0.65) m.savesAway++; }
    } else {
      m.shotsAway++;
      m.xgAway += 0.05 + Math.random() * 0.2;
      if (onT) { m.shotsOnTargetAway++; if (Math.random() < 0.65) m.savesHome++; }
    }
    m.nextShot = 60 + rand(0, 180);
  }
  m.nextOffside -= intensity;
  if (m.nextOffside <= 0) {
    var s6 = Math.random() < 0.5 ? 'home' : 'away';
    if (s6 === 'home') m.offsidesHome++; else m.offsidesAway++;
    m.nextOffside = 300 + rand(0, 600);
  }

  var targetPoss = 50 + (m.homeAtk - m.awayAtk) * 10;
  if (m.phase === 'pressure_home') targetPoss += 10;
  if (m.phase === 'pressure_away') targetPoss -= 10;
  targetPoss += (m.scoreHome - m.scoreAway) * 3;
  if (m.redHome) targetPoss -= 20;
  if (m.redAway) targetPoss += 20;
  m.possessionHome = Math.round(m.possessionHome * 0.97 + targetPoss * 0.03);
  m.possessionHome = clamp(m.possessionHome, 25, 75);

  var pGoal = 0.0035 * goalBoost;
  var lamH = footballExpectedLambda(m, 'home');
  var lamA = footballExpectedLambda(m, 'away');
  var totalLam = lamH + lamA;
  if (totalLam > 0 && Math.random() < pGoal) {
    var pHG = lamH / totalLam;
    if (Math.random() < pHG) {
      m.scoreHome++; m.xgHome += 0.4 + Math.random() * 0.5;
      m.shotsOnTargetHome++;
      m.momentum = Math.min(1, m.momentum + 0.6);
      m.justScored = 'home';
      m.commentary = '⚽ ГОЛ! ' + m.home + ' — ' + m.scoreHome + ':' + m.scoreAway + ' (' + Math.floor(m.minute) + "')";
      m.phase = 'pressure_away';
      m.phaseSecLeft = 20 + rand(0, 20);
    } else {
      m.scoreAway++; m.xgAway += 0.4 + Math.random() * 0.5;
      m.shotsOnTargetAway++;
      m.momentum = Math.max(-1, m.momentum - 0.6);
      m.justScored = 'away';
      m.commentary = '⚽ ГОЛ! ' + m.away + ' — ' + m.scoreHome + ':' + m.scoreAway + ' (' + Math.floor(m.minute) + "')";
      m.phase = 'pressure_home';
      m.phaseSecLeft = 20 + rand(0, 20);
    }
  } else if (Math.random() < 0.006) {
    var sM = Math.random() < 0.5 ? 'home' : 'away';
    if (sM === 'home') { m.shotsHome++; m.xgHome += 0.15; m.commentary = '🔥 Опасный момент — ' + m.home; }
    else { m.shotsAway++; m.xgAway += 0.15; m.commentary = '🔥 Опасный момент — ' + m.away; }
  }
}

/* ============================================================
   ХОККЕЙ — 3 периода × 20 "минут"
   ============================================================ */
var HK_PERIOD_SEC = 20;
var HK_BREAK_SEC = 2;

function newHockey() {
  var lgs = [];
  var seen = {};
  HOCKEY.forEach(function(t) { if (!seen[t.lg]) { seen[t.lg] = 1; lgs.push(t.lg); } });
  var lg = pick(lgs);
  var teams = HOCKEY.filter(function(t) { return t.lg === lg; });
  var pair = pickTwo(teams);
  var h = pair[0], a = pair[1];
  return {
    id: STATE.nextId++,
    sport: 'hockey', league: lg,
    home: h.n, away: a.n,
    homeAtk: h.atk, awayAtk: a.atk,
    homeDef: h.def, awayDef: a.def,
    homeRating: h.rt, awayRating: a.rt,
    homeCountry: h.country, awayCountry: a.country,
    scoreHome: 0, scoreAway: 0,
    periodScores: [{h:0,a:0},{h:0,a:0},{h:0,a:0}],
    period: 1, periodSec: 0,
    minute: 0, maxMinute: 60,
    penaltyHome: 0, penaltyAway: 0,
    emptyNet: null,
    shotsHome: 0, shotsAway: 0,
    savesHome: 0, savesAway: 0,
    hitsHome: 0, hitsAway: 0,
    isBreak: false, breakTimer: 0,
    overtime: false, shootout: false,
    finalResult: null,
    justScored: null,
    status: 'live', momentum: 0,
    commentary: 'Матч начинается'
  };
}

function hockeyExpectedLambda(m, side) {
  var base = side === 'home' ? m.homeAtk : m.awayAtk;
  var oppDef = side === 'home' ? m.awayDef : m.homeDef;
  var homeAdv = side === 'home' ? 1.08 : 0.94;
  var lambda = base * (oppDef / 3.0) * homeAdv * 0.55;
  if (side === 'home' && m.penaltyAway > 0) lambda *= 2.8;
  if (side === 'away' && m.penaltyHome > 0) lambda *= 2.8;
  if (side === 'home' && m.emptyNet === 'away') lambda *= 5;
  if (side === 'away' && m.emptyNet === 'home') lambda *= 5;
  var mom = side === 'home' ? m.momentum : -m.momentum;
  lambda *= (1 + mom * 0.3);
  return Math.max(0.03, lambda);
}

function simulateHockeyTick(m) {
  if (m.isBreak) {
    m.breakTimer += 1;
    if (m.breakTimer >= HK_BREAK_SEC) {
      m.isBreak = false;
      m.period += 1;
      m.periodSec = 0;
      m.penaltyHome = 0; m.penaltyAway = 0;
      m.emptyNet = null;
      if (m.period > 3) {
        if (m.scoreHome === m.scoreAway) {
          m.overtime = true;
          m.period = 4;
          m.commentary = '🔥 Овертайм! 5 минут';
        } else {
          m.status = 'finished';
          m.finishedAt = Date.now();
          m.commentary = '🏁 Матч завершён: ' + m.scoreHome + ':' + m.scoreAway;
        }
        return;
      }
      m.commentary = 'Период ' + m.period + ' начался';
    }
    return;
  }

  m.periodSec += 1;
  m.minute += 1;
  m.justScored = null;
  m.momentum *= 0.94;

  if (m.period === 4 && m.periodSec >= 5) {
    m.shootout = true;
    var hG = 0, aG = 0;
    for (var i = 0; i < 5; i++) {
      if (Math.random() < 0.35) hG++;
      if (Math.random() < 0.35) aG++;
    }
    var guard = 0;
    while (hG === aG && guard++ < 30) {
      if (Math.random() < 0.4) hG++;
      if (Math.random() < 0.4) aG++;
    }
    if (hG > aG) { m.scoreHome += 1; m.finalResult = {winner: 'home', method: 'Буллиты'}; }
    else { m.scoreAway += 1; m.finalResult = {winner: 'away', method: 'Буллиты'}; }
    m.status = 'finished';
    m.finishedAt = Date.now();
    m.commentary = '🎯 Буллиты! Победа ' + (hG > aG ? m.home : m.away);
    return;
  }

  if (m.period <= 3 && m.periodSec >= HK_PERIOD_SEC) {
    m.isBreak = true;
    m.breakTimer = 0;
    m.commentary = '⏸ Перерыв. Счёт: ' + m.scoreHome + ':' + m.scoreAway;
    return;
  }

  if (m.penaltyHome > 0) m.penaltyHome = Math.max(0, m.penaltyHome - 1);
  if (m.penaltyAway > 0) m.penaltyAway = Math.max(0, m.penaltyAway - 1);

  if (m.period === 3 && m.periodSec >= 18 && m.scoreHome !== m.scoreAway) {
    if (m.scoreHome < m.scoreAway) m.emptyNet = 'home';
    else m.emptyNet = 'away';
  } else if (m.period !== 3) {
    m.emptyNet = null;
  }

  if (Math.random() < 0.03 && m.penaltyHome === 0 && m.penaltyAway === 0) {
    if (Math.random() < 0.5) {
      m.penaltyHome = 4;
      m.commentary = '🟨 Удаление — ' + m.home + ' (2 мин)';
    } else {
      m.penaltyAway = 4;
      m.commentary = '🟨 Удаление — ' + m.away + ' (2 мин)';
    }
  }

  var lamH = hockeyExpectedLambda(m, 'home') / 60;
  var lamA = hockeyExpectedLambda(m, 'away') / 60;

  if (Math.random() < lamH) {
    m.scoreHome++;
    m.shotsHome++;
    m.justScored = 'home';
    m.momentum = Math.min(1, m.momentum + 0.4);
    var pp = m.penaltyAway > 0 ? ' (большинство!)' : (m.emptyNet === 'away' ? ' (пустые!)' : '');
    m.commentary = '🏒 ГОЛ! ' + m.home + ' — ' + m.scoreHome + ':' + m.scoreAway + pp;
    if (m.period <= 3) m.periodScores[m.period - 1].h += 1;
  } else if (Math.random() < lamA) {
    m.scoreAway++;
    m.shotsAway++;
    m.justScored = 'away';
    m.momentum = Math.max(-1, m.momentum - 0.4);
    var pp2 = m.penaltyHome > 0 ? ' (большинство!)' : (m.emptyNet === 'home' ? ' (пустые!)' : '');
    m.commentary = '🏒 ГОЛ! ' + m.away + ' — ' + m.scoreHome + ':' + m.scoreAway + pp2;
    if (m.period <= 3) m.periodScores[m.period - 1].a += 1;
  } else {
    var r = Math.random();
    if (r < 0.10) { m.shotsHome++; m.savesAway++; }
    else if (r < 0.20) { m.shotsAway++; m.savesHome++; }
    else if (r < 0.25) { m.hitsHome++; m.commentary = '💥 ' + m.home + ' силовой'; }
    else if (r < 0.30) { m.hitsAway++; m.commentary = '💥 ' + m.away + ' силовой'; }
    else if (m.penaltyHome > 0) m.commentary = '🔥 Большинство у ' + m.away;
    else if (m.penaltyAway > 0) m.commentary = '🔥 Большинство у ' + m.home;
  }
}

/* ============================================================
   UFC — 5 раундов по 300 сек
   ============================================================ */
var UFC_ROUND_SEC = 300;
var UFC_BREAK_SEC = 60;
var UFC_MAX_ROUNDS = 5;

function newUFC() {
  var divs = [];
  var seen = {};
  UFC.forEach(function(f) { if (!seen[f.div]) { seen[f.div] = 1; divs.push(f.div); } });
  var div = pick(divs);
  var pool = UFC.filter(function(f) { return f.div === div; });
  var pair = pickTwo(pool);
  var h = pair[0], a = pair[1];
  return {
    id: STATE.nextId++,
    sport: 'ufc', league: 'UFC · ' + div,
    home: h.n, away: a.n,
    homeRating: h.rt, awayRating: a.rt,
    homeCountry: h.country, awayCountry: a.country,
    homeFighter: {power: h.power, acc: h.acc, td: h.td, style: h.style, hpMax: h.hpMax, stamMax: h.stamMax},
    awayFighter: {power: a.power, acc: a.acc, td: a.td, style: a.style, hpMax: a.hpMax, stamMax: a.stamMax},
    homeHP: h.hpMax, awayHP: a.hpMax,
    homeStam: h.stamMax, awayStam: a.stamMax,
    round: 1, roundSec: 0, minute: 0, maxMinute: UFC_MAX_ROUNDS * UFC_ROUND_SEC,
    phase: 'fight',
    scoreHome: 0, scoreAway: 0,
    roundScores: [],
    status: 'live', momentum: 0,
    finalResult: null, justScored: null,
    commentary: 'Начало боя'
  };
}

function simulateUFCTick(m) {
  if (m.phase === 'break') {
    m.roundSec += 1;
    if (m.roundSec >= UFC_BREAK_SEC) {
      m.phase = 'fight'; m.roundSec = 0;
      m.homeStam = Math.min(m.homeFighter.stamMax, m.homeStam + 18);
      m.awayStam = Math.min(m.awayFighter.stamMax, m.awayStam + 18);
      m.commentary = 'Раунд ' + m.round + ' начинается';
    }
    return;
  }
  m.roundSec += 1;
  m.minute += 1;

  var hAcc = m.homeFighter.acc * (m.homeStam / m.homeFighter.stamMax);
  var aAcc = m.awayFighter.acc * (m.awayStam / m.awayFighter.stamMax);
  var hPow = m.homeFighter.power * (0.7 + 0.3 * (m.homeStam / m.homeFighter.stamMax));
  var aPow = m.awayFighter.power * (0.7 + 0.3 * (m.awayStam / m.awayFighter.stamMax));

  var hAct = hAcc / 100 * 0.35;
  var aAct = aAcc / 100 * 0.35;
  var hTd = m.homeFighter.td / 100 * 0.05 * (m.homeStam / m.homeFighter.stamMax);
  var aTd = m.awayFighter.td / 100 * 0.05 * (m.awayStam / m.awayFighter.stamMax);

  if (Math.random() < hTd && m.homeFighter.style !== 'striker') {
    m.commentary = m.home + ' проходит в партер!';
    m.awayHP -= hPow * 0.35;
    m.homeStam -= 2;
    if (Math.random() < 0.10 && m.awayHP < 40) { finishUFC(m, 'home', 'Сабмишн', m.round); return; }
  }
  if (Math.random() < aTd && m.awayFighter.style !== 'striker') {
    m.commentary = m.away + ' проходит в партер!';
    m.homeHP -= aPow * 0.35;
    m.awayStam -= 2;
    if (Math.random() < 0.10 && m.homeHP < 40) { finishUFC(m, 'away', 'Сабмишн', m.round); return; }
  }
  if (Math.random() < hAct) {
    if (Math.random() < hAcc / 100 * 0.55) {
      m.awayHP -= hPow * 0.18;
      m.homeStam -= 1.2; m.awayStam -= 0.8;
      if (Math.random() < 0.02 && m.awayHP < 15) { finishUFC(m, 'home', 'KO/TKO', m.round); return; }
    } else m.homeStam -= 1.5;
  }
  if (Math.random() < aAct) {
    if (Math.random() < aAcc / 100 * 0.55) {
      m.homeHP -= aPow * 0.18;
      m.awayStam -= 1.2; m.homeStam -= 0.8;
      if (Math.random() < 0.02 && m.homeHP < 15) { finishUFC(m, 'away', 'KO/TKO', m.round); return; }
    } else m.awayStam -= 1.5;
  }

  if (m.homeStam < 5) m.homeStam = 5;
  if (m.awayStam < 5) m.awayStam = 5;
  if (m.homeHP < 0) m.homeHP = 0;
  if (m.awayHP < 0) m.awayHP = 0;

  if (m.roundSec >= UFC_ROUND_SEC) {
    var scoreDiff = (m.homeHP - m.awayHP) + (m.homeStam - m.awayStam) * 0.3;
    var rh = 10, ra = 10;
    if (scoreDiff > 15) ra = 8;
    else if (scoreDiff > 3) ra = 9;
    else if (scoreDiff < -15) rh = 8;
    else if (scoreDiff < -3) rh = 9;
    m.roundScores.push({h: rh, a: ra});

    if (m.round >= UFC_MAX_ROUNDS) {
      var totH = 0, totA = 0;
      m.roundScores.forEach(function(rs) { totH += rs.h; totA += rs.a; });
      if (m.homeHP < 15 && m.awayHP > m.homeHP * 2) { finishUFC(m, 'away', 'KO/TKO', m.round); return; }
      if (m.awayHP < 15 && m.homeHP > m.awayHP * 2) { finishUFC(m, 'home', 'KO/TKO', m.round); return; }
      var winner = totH >= totA ? 'home' : 'away';
      finishUFC(m, winner, 'Решение', 5);
      return;
    }
    m.round += 1;
    m.phase = 'break';
    m.roundSec = 0;
    m.commentary = 'Перерыв. Раунд ' + (m.round - 1) + ' завершён';
  }
}

function finishUFC(m, winner, method, round) {
  m.finalResult = {winner: winner, method: method, round: round};
  if (winner === 'home') { m.scoreHome = 1; m.scoreAway = 0; m.justScored = 'home'; }
  else { m.scoreHome = 0; m.scoreAway = 1; m.justScored = 'away'; }
  m.status = 'finished';
  m.finishedAt = Date.now();
  m.commentary = '🏆 ' + (winner === 'home' ? m.home : m.away) + ' побеждает · ' + method + ' · R' + round;
}

/* ============================================================
   ВОЛЕЙБОЛ — посекундные розыгрыши
   ============================================================ */
function newVolleyball() {
  var pair = pickTwo(VOLLEYBALL);
  var h = pair[0], a = pair[1];
  return {
    id: STATE.nextId++,
    sport: 'volleyball', league: h.lg,
    home: h.n, away: a.n,
    homeAtk: h.atk, awayAtk: a.atk,
    homeServe: h.serve, awayServe: a.serve,
    homeBlock: h.block, awayBlock: a.block,
    homeRating: h.rt, awayRating: a.rt,
    homeCountry: h.country, awayCountry: a.country,
    setsHome: 0, setsAway: 0, pointsHome: 0, pointsAway: 0,
    setHistory: [],
    roundSec: 0, minute: 0, maxMinute: 2400,
    serving: 'home',
    timeoutHomeUsed: false, timeoutAwayUsed: false,
    status: 'live', momentum: 0, justScored: null,
    commentary: 'Матч начинается. Подача у ' + h.n
  };
}

function simulateVolleyballTick(m) {
  m.roundSec += 1;
  m.minute += 1;
  if (m.roundSec < 5) return;
  m.roundSec = 0;

  var isFifth = (m.setsHome === 2 && m.setsAway === 2);
  var target = isFifth ? 15 : 25;

  var pHome;
  if (m.serving === 'home') pHome = 0.5 + (m.homeServe - 1) * 0.18 - (m.awayBlock - 1) * 0.10;
  else pHome = 0.5 - (m.awayServe - 1) * 0.18 + (m.homeBlock - 1) * 0.10;
  pHome = clamp(pHome, 0.30, 0.70);

  if (Math.random() < pHome) { m.pointsHome++; m.serving = 'home'; }
  else { m.pointsAway++; m.serving = 'away'; }

  if (!m.timeoutHomeUsed && m.pointsAway - m.pointsHome >= 8 && (m.setsHome + m.setsAway) < 3) {
    m.timeoutHomeUsed = true;
    m.commentary = '⏸ Тайм-аут ' + m.home;
  }
  if (!m.timeoutAwayUsed && m.pointsHome - m.pointsAway >= 8 && (m.setsHome + m.setsAway) < 3) {
    m.timeoutAwayUsed = true;
    m.commentary = '⏸ Тайм-аут ' + m.away;
  }

  if (m.pointsHome >= target && m.pointsHome - m.pointsAway >= 2) {
    m.setsHome++;
    m.setHistory.push({winner: 'home', h: m.pointsHome, a: m.pointsAway});
    m.justScored = 'home';
    m.commentary = '🎯 ' + m.home + ' берёт сет ' + m.pointsHome + ':' + m.pointsAway;
    m.pointsHome = 0; m.pointsAway = 0;
    m.timeoutHomeUsed = false; m.timeoutAwayUsed = false;
  } else if (m.pointsAway >= target && m.pointsAway - m.pointsHome >= 2) {
    m.setsAway++;
    m.setHistory.push({winner: 'away', h: m.pointsHome, a: m.pointsAway});
    m.justScored = 'away';
    m.commentary = '🎯 ' + m.away + ' берёт сет ' + m.pointsHome + ':' + m.pointsAway;
    m.pointsHome = 0; m.pointsAway = 0;
    m.timeoutHomeUsed = false; m.timeoutAwayUsed = false;
  }
  if (m.setsHome >= 3 || m.setsAway >= 3) {
    m.status = 'finished';
    m.finishedAt = Date.now();
    m.commentary = '🏆 ' + (m.setsHome > m.setsAway ? m.home : m.away) + ' побеждает ' + m.setsHome + ':' + m.setsAway;
  }
}

/* ============================================================
   УНИВЕРСАЛЬНЫЙ ТИК
   ============================================================ */
function tickMatch(m) {
  if (m.status === 'countdown') {
    m.countdownLeft -= 1;
    if (m.countdownLeft <= 0) {
      var nm;
      if (m.sport === 'football') nm = newFootball();
      else if (m.sport === 'hockey') nm = newHockey();
      else if (m.sport === 'volleyball') nm = newVolleyball();
      else nm = newUFC();
      nm.id = m.id;
      for (var k in m) delete m[k];
      for (var k2 in nm) m[k2] = nm[k2];
    }
    return;
  }
  if (m.status !== 'live') return;
  if (m.sport === 'football') simulateFootballTick(m);
  else if (m.sport === 'hockey') simulateHockeyTick(m);
  else if (m.sport === 'volleyball') simulateVolleyballTick(m);
  else if (m.sport === 'ufc') simulateUFCTick(m);
}

/* ============================================================
   КОЭФЫ — основные исходы (1X2 для футбола/хоккея, 1-2 для UFC/волейбола)
   ============================================================ */
function computeFootballOdds(m) {
  if (m.status === 'finished' || m.status === 'countdown') return {home: null, draw: null, away: null};
  var rem = m.maxMinute - m.minute;
  if (rem <= 0) return {home: null, draw: null, away: null};
  var lamH = footballExpectedLambda(m, 'home') * rem / 90;
  var lamA = footballExpectedLambda(m, 'away') * rem / 90;
  var pH = 0, pD = 0, pA = 0;
  for (var h = 0; h <= 10; h++) {
    for (var a = 0; a <= 10; a++) {
      var p = poisson(h, lamH) * poisson(a, lamA);
      var fh = m.scoreHome + h, fa = m.scoreAway + a;
      if (fh > fa) pH += p; else if (fh === fa) pD += p; else pA += p;
    }
  }
  var t = pH + pD + pA || 1;
  return {home: toOdd(pH / t), draw: toOdd(pD / t), away: toOdd(pA / t)};
}

function computeHockeyOdds(m) {
  if (m.status === 'finished' || m.status === 'countdown') return {home: null, draw: null, away: null};
  var rem = m.period === 4 ? 5 : (60 - m.minute);
  if (rem <= 0) rem = 0.5;
  var lamH = hockeyExpectedLambda(m, 'home') * rem / 60;
  var lamA = hockeyExpectedLambda(m, 'away') * rem / 60;
  var pH = 0, pD = 0, pA = 0;
  for (var h = 0; h <= 8; h++) {
    for (var a = 0; a <= 8; a++) {
      var p = poisson(h, lamH) * poisson(a, lamA);
      var fh = m.scoreHome + h, fa = m.scoreAway + a;
      if (fh > fa) pH += p; else if (fh === fa) pD += p; else pA += p;
    }
  }
  var t = pH + pD + pA || 1;
  return {home: toOdd(pH / t), draw: toOdd(pD / t), away: toOdd(pA / t)};
}

function ufcProbHome(m) {
  if (m.status === 'finished') {
    if (!m.finalResult) return 0.5;
    return m.finalResult.winner === 'home' ? 1 : 0;
  }
  if (m.status === 'countdown') return 0.5;
  var hpDiff = (m.homeHP - m.awayHP) / Math.max(1, m.homeFighter.hpMax);
  var stamDiff = (m.homeStam - m.awayStam) / Math.max(1, m.homeFighter.stamMax);
  var ratingDiff = (m.homeRating - m.awayRating) / 400;
  var base = 1 / (1 + Math.pow(10, -ratingDiff));
  var prog = m.minute / Math.max(1, m.maxMinute);
  var pH = base + hpDiff * 0.4 + stamDiff * 0.15;
  pH = clamp(pH, 0.05, 0.95);
  pH = 0.5 + (pH - 0.5) * (1 - prog * 0.3);
  return clamp(pH, 0.05, 0.95);
}

function computeUFCOdds(m) {
  if (m.status === 'finished' || m.status === 'countdown') return {home: null, draw: null, away: null};
  var pH = ufcProbHome(m);
  return {home: toOdd(pH), away: toOdd(1 - pH), draw: null};
}

function volleyProbHome(m) {
  if (m.status === 'finished') return m.setsHome > m.setsAway ? 1 : 0;
  if (m.status === 'countdown') return 0.5;
  var d = (m.homeAtk - m.awayAtk) * 0.18 + (m.homeServe - m.awayServe) * 0.08 - (m.homeBlock - m.awayBlock) * 0.05;
  var base = clamp(0.5 + d, 0.15, 0.85);
  var isFifth = (m.setsHome === 2 && m.setsAway === 2);
  var target = isFifth ? 15 : 25;
  var curScore = (m.pointsHome - m.pointsAway) / target;
  var setScore = m.setsHome - m.setsAway;
  var pH = base + curScore * 0.15 + setScore * 0.10;
  var remainPoints = target - Math.max(m.pointsHome, m.pointsAway);
  if (remainPoints < 5) pH += (m.pointsHome - m.pointsAway) * 0.04;
  return clamp(pH, 0.05, 0.95);
}

function computeVolleyballOdds(m) {
  if (m.status === 'finished' || m.status === 'countdown') return {home: null, draw: null, away: null};
  var pH = volleyProbHome(m);
  return {home: toOdd(pH), away: toOdd(1 - pH), draw: null};
}

function computeOdds(m) {
  if (m.sport === 'football') return computeFootballOdds(m);
  if (m.sport === 'hockey') return computeHockeyOdds(m);
  if (m.sport === 'ufc') return computeUFCOdds(m);
  if (m.sport === 'volleyball') return computeVolleyballOdds(m);
  return {home: null, draw: null, away: null};
}

/* ============================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ UI
   ============================================================ */
function formatTimeLeft(m) {
  if (m.status === 'countdown') return 'Далее';
  if (m.status === 'finished') return 'Завершён';
  if (m.sport === 'football') {
    if (m.isBreak) return 'Перерыв';
    var mins = Math.floor(m.minute);
    var half = m.minute < 45 ? '1-й' : '2-й';
    return half + ' · ' + mins + "'";
  }
  if (m.sport === 'hockey') {
    if (m.isBreak) return 'Перерыв';
    if (m.period === 4) return 'ОТ · ' + ft(m.periodSec);
    return m.period + '-й пер · ' + ft(m.periodSec);
  }
  if (m.sport === 'ufc') {
    if (m.phase === 'break') return 'Перерыв';
    return 'R' + m.round + ' · ' + ft(m.roundSec);
  }
  if (m.sport === 'volleyball') {
    var sn = m.setsHome + m.setsAway + 1;
    return 'Сет ' + Math.min(5, sn) + ' · ' + m.pointsHome + ':' + m.pointsAway;
  }
  return '';
}

function isLive(m) { return m.status === 'live'; }
function isFinished(m) { return m.status === 'finished'; }
/* ============================================================
   app.js — Часть 2: рендер, экраны, купон, ставки
   ============================================================ */

/* ============ ИКОНКИ СПОРТОВ ============ */
var SPORTS_LIST = [
  {key:'all',        name:'Все',      icon:'🔥'},
  {key:'football',   name:'Футбол',   icon:'⚽'},
  {key:'hockey',     name:'Хоккей',   icon:'🏒'},
  {key:'volleyball', name:'Волейбол', icon:'🏐'},
  {key:'ufc',        name:'UFC',      icon:'🥊'}
];

/* ============ ХЕЛПЕРЫ РЕНДЕРА ============ */
function el(html) {
  var d = document.createElement('div');
  d.innerHTML = html;
  return d.firstChild;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function countLive(sport) {
  var c = 0;
  for (var i = 0; i < STATE.matches.length; i++) {
    var m = STATE.matches[i];
    if (sport === 'all' || m.sport === sport) {
      if (m.status === 'live' || m.status === 'countdown') c++;
    }
  }
  return c;
}

/* ============ ГЛАВНЫЙ РЕНДЕР ============ */
function renderApp() {
  if (STATE.screen === 'match' && STATE.currentMatch) {
    renderMatchScreen();
  } else {
    renderMainScreen();
  }
  renderTabBar();
  renderFloatingCoupon();
}

/* ============ TOP HEADER ============ */
function renderTopHeader(opts) {
  opts = opts || {};
  var back = opts.back ? '<button class="back-btn" id="btnBack">←</button>' : '';
  var title = opts.title || 'Главная';
  var titleClass = opts.back ? 'title center' : 'title';
  return '' +
    '<div class="top-header">' +
      back +
      '<div class="' + titleClass + '">' + title + '</div>' +
      '<div class="actions">' +
        '<button class="action-btn" id="btnAddFunds">＋</button>' +
        '<button class="action-btn with-dot" id="btnProfile">👤</button>' +
      '</div>' +
    '</div>';
}

/* ============ SPORT TABS ============ */
function renderSportTabs() {
  var html = '<div class="sport-tabs"><div class="sport-tabs-inner">';
  SPORTS_LIST.forEach(function(s) {
    var active = STATE.currentSport === s.key ? ' active' : '';
    var cnt = countLive(s.key);
    html += '<button class="sport-tab' + active + '" data-sport="' + s.key + '">' +
      '<span class="icon">' + s.icon + '</span>' +
      '<span class="sport-tab-name">' + s.name + '</span>' +
      '<span class="count">' + cnt + '</span>' +
    '</button>';
  });
  html += '</div></div>';
  return html;
}

/* ============ FILTER ROW ============ */
function renderFilterRow() {
  return '' +
    '<div class="filter-row">' +
      '<button class="filter-chip ' + (STATE.currentFilter === 'top' ? 'active' : '') + '" data-filter="top">Топ</button>' +
      '<button class="filter-chip ' + (STATE.currentFilter === 'live' ? 'active' : '') + '" data-filter="live"><span class="dot"></span>Live</button>' +
    '</div>';
}

/* ============ MATCH ROW (главная) ============ */
function renderMatchRow(m) {
  var odds = computeOdds(m);
  var isFin = m.status === 'finished';
  var isCd = m.status === 'countdown';

  // Команды с логотипами
  var hColor = teamColor(m.home);
  var aColor = teamColor(m.away);
  var homeScore = '';
  var awayScore = '';
  if (!isCd && m.sport !== 'ufc') {
    var winnerH = m.scoreHome > m.scoreAway;
    var winnerA = m.scoreAway > m.scoreHome;
    if (winnerH) { homeScore = '<span class="team-score red">' + m.scoreHome + '</span>'; awayScore = '<span class="team-score">' + m.scoreAway + '</span>'; }
    else if (winnerA) { homeScore = '<span class="team-score">' + m.scoreHome + '</span>'; awayScore = '<span class="team-score red">' + m.scoreAway + '</span>'; }
    else { homeScore = '<span class="team-score">' + m.scoreHome + '</span>'; awayScore = '<span class="team-score">' + m.scoreAway + '</span>'; }
  } else if (m.sport === 'volleyball') {
    homeScore = '<span class="team-score">' + m.setsHome + '</span>';
    awayScore = '<span class="team-score">' + m.setsAway + '</span>';
  }

  var cardsHtml = '';
  if (!isFin && !isCd) {
    var cards = '';
    if (m.sport === 'football') {
      if (m.cardsHome > 0) cards += '<span class="ind-yellow"></span>';
      if (m.cardsAway > 0) cards += '<span class="ind-yellow"></span>';
      if (m.redHome || m.redAway) cards += '<span class="ind-red"></span>';
    } else if (m.sport === 'hockey') {
      if (m.penaltyHome > 0) cards += '<span class="ind-yellow"></span>';
      if (m.penaltyAway > 0) cards += '<span class="ind-yellow"></span>';
    }
    if (cards) cardsHtml = '<div class="cards-indicators">' + cards + '</div>';
  }

  // Время
  var timeHtml;
  if (isFin) timeHtml = '<div class="time">🏁 Завершён</div>';
  else if (isCd) timeHtml = '<div class="time">⏱ Далее</div>';
  else {
    var liveDot = isLive(m) ? '<span class="live-dot"></span>' : '';
    var tl = formatTimeLeft(m);
    timeHtml = '<div class="time ' + (isLive(m) ? 'live' : '') + '">' + liveDot + tl + '</div>';
  }

  // Кэфы
  var cellH = renderOddCell(m, 'home', odds.home, isFin || isCd);
  var cellD = m.sport === 'ufc' || m.sport === 'volleyball' ?
    '<div class="odd-cell dash"></div>' :
    renderOddCell(m, 'draw', odds.draw, isFin || isCd);
  var cellA = renderOddCell(m, 'away', odds.away, isFin || isCd);

  return '' +
    '<div class="match-row" data-match-id="' + m.id + '">' +
      cardsHtml +
      '<div class="arrow">›</div>' +
      '<div class="teams">' +
        '<div class="team-line">' +
          '<span class="team-logo" style="background:' + hColor + '">' + teamInit(m.home) + '</span>' +
          '<span class="team-name">' + escapeHtml(m.home) + '</span>' +
          homeScore +
        '</div>' +
        '<div class="team-line">' +
          '<span class="team-logo" style="background:' + aColor + '">' + teamInit(m.away) + '</span>' +
          '<span class="team-name">' + escapeHtml(m.away) + '</span>' +
          awayScore +
        '</div>' +
        timeHtml +
      '</div>' +
      cellH +
      cellD +
      cellA +
    '</div>';
}

function renderOddCell(m, pick, odd, disabled) {
  if (!isValid(odd)) {
    return '<div class="odd-cell dash"></div>';
  }
  var isSel = isInCoupon(m.id, pick);
  var cls = 'odd-cell' + (isSel ? ' selected' : '') + (disabled ? ' disabled' : '');
  return '<div class="' + cls + '" data-match-id="' + m.id + '" data-pick="' + pick + '">' +
    odd.toFixed(2) +
  '</div>';
}

/* ============ MAIN SCREEN ============ */
function renderMainScreen() {
  var html = renderTopHeader({title: 'Главная'});
  html += renderSportTabs();
  html += renderFilterRow();

  // Группируем матчи по лигам
  var filtered = [];
  for (var i = 0; i < STATE.matches.length; i++) {
    var m = STATE.matches[i];
    if (STATE.currentSport !== 'all' && m.sport !== STATE.currentSport) continue;
    if (STATE.currentFilter === 'live' && m.status !== 'live') continue;
    filtered.push(m);
  }
  // сортировка
  filtered.sort(function(a, b) {
    var ord = {live: 0, countdown: 1, finished: 2};
    if (ord[a.status] !== ord[b.status]) return ord[a.status] - ord[b.status];
    return a.minute - b.minute;
  });

  // группировка по лигам
  var groups = {};
  var groupOrder = [];
  filtered.forEach(function(m) {
    var key = m.sport + '|' + m.league;
    if (!groups[key]) { groups[key] = {sport: m.sport, league: m.league, matches: []}; groupOrder.push(key); }
    groups[key].matches.push(m);
  });

  html += '<div class="main">';
  if (!groupOrder.length) {
    html += '<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">Матчей нет</div></div>';
  } else {
    groupOrder.forEach(function(key) {
      var g = groups[key];
      html += '<div class="league-block">' +
        '<div class="league-head">' +
          '<div class="league-icon">' + sIcon(g.sport) + '</div>' +
          '<div class="league-name">' + escapeHtml(g.league) + '</div>' +
          '<button class="league-filter">⚙︎</button>' +
        '</div>';
      g.matches.forEach(function(m) {
        html += renderMatchRow(m);
      });
      html += '</div>';
    });
    html += '<button class="show-all" id="btnShowAll">Все события</button>';
  }
  html += '</div>';

  $('app').innerHTML = html;
  bindMainScreen();
}

/* ============ MATCH SCREEN ============ */
function renderMatchScreen() {
  var m = STATE.currentMatch;
  if (!m) { STATE.screen = 'main'; renderApp(); return; }

  var html = renderTopHeader({title: sName(m.sport), back: true});

  // Match header
  html += renderMatchHeader(m);

  // Market tabs
  html += renderMarketTabs(m);

  // Market body
  html += '<div class="main no-pad">';
  html += renderMarketsBody(m);
  html += '</div>';

  $('app').innerHTML = html;
  bindMatchScreen();
}

function renderMatchHeader(m) {
  var hColor = teamColor(m.home);
  var aColor = teamColor(m.away);

  var scoreCenter = '';
  if (m.status === 'countdown') scoreCenter = '<div class="score-center"><span>— : —</span><span class="timer">Далее</span></div>';
  else if (m.sport === 'volleyball') scoreCenter = '<div class="score-center"><span>' + m.setsHome + ' : ' + m.setsAway + '</span><span class="timer ' + (isLive(m) ? 'live' : '') + '">' + formatTimeLeft(m) + '</span></div>';
  else if (m.sport === 'ufc') scoreCenter = '<div class="score-center"><span>— : —</span><span class="timer ' + (isLive(m) ? 'live' : '') + '">' + formatTimeLeft(m) + '</span></div>';
  else scoreCenter = '<div class="score-center"><span>' + m.scoreHome + ' : ' + m.scoreAway + '</span><span class="timer ' + (isLive(m) ? 'live' : '') + '">' + formatTimeLeft(m) + '</span></div>';

  // Half scores для футбола
  var halfScores = '';
  if (m.sport === 'football' && m.status !== 'countdown') {
    halfScores = '<div class="half-scores">' +
      '<div>1-й<b>' + m.scoreHome + '</b></div>' +
      '<div>2-й<b>—</b></div>' +
      '<div>Жёлтые<b>' + m.cardsHome + '-' + m.cardsAway + '</b></div>' +
      '<div>Красные<b>' + (m.redHome ? 1 : 0) + '-' + (m.redAway ? 1 : 0) + '</b></div>' +
      '<div>Углы<b>' + m.cornersHome + '-' + m.cornersAway + '</b></div>' +
    '</div>';
  }
  if (m.sport === 'hockey') {
    halfScores = '<div class="half-scores">' +
      '<div>1-й<b>' + m.periodScores[0].h + ':' + m.periodScores[0].a + '</b></div>' +
      '<div>2-й<b>' + m.periodScores[1].h + ':' + m.periodScores[1].a + '</b></div>' +
      '<div>3-й<b>' + m.periodScores[2].h + ':' + m.periodScores[2].a + '</b></div>' +
      '<div>Броски<b>' + m.shotsHome + '-' + m.shotsAway + '</b></div>' +
      '<div>Удаления<b>' + (m.penaltyHome > 0 ? 1 : 0) + '-' + (m.penaltyAway > 0 ? 1 : 0) + '</b></div>' +
    '</div>';
  }

  return '' +
    '<div class="match-header">' +
      '<div class="crumbs">' + sName(m.sport) + ' / ' + escapeHtml(m.league) + '</div>' +
      '<div class="league-line">' +
        '<span>' + escapeHtml(m.league) + '</span>' +
        '<span class="updown">⇅</span>' +
      '</div>' +
      '<div class="match-meta">' +
        '<span>' + (m.status === 'live' ? 'LIVE' : m.status === 'countdown' ? 'Далее' : 'Завершён') + '</span>' +
        '<span class="icons"><span>🔔</span><span>⭐</span></span>' +
      '</div>' +
      '<div class="score-line">' +
        '<div class="team-big">' +
          '<span class="logo" style="background:' + hColor + '">' + teamInit(m.home) + '</span>' +
          '<span class="name">' + escapeHtml(m.home) + '</span>' +
        '</div>' +
        scoreCenter +
        '<div class="team-big right">' +
          '<span class="logo" style="background:' + aColor + '">' + teamInit(m.away) + '</span>' +
          '<span class="name">' + escapeHtml(m.away) + '</span>' +
        '</div>' +
      '</div>' +
      halfScores +
    '</div>';
}

function renderMarketTabs(m) {
  var tabs = [
    {key:'popular', label:'Популярное'},
    {key:'match',   label:'Матч'},
    {key:'stats',   label:'Показатели команд'}
  ];
  var html = '<div class="market-tabs"><div class="market-tabs-inner">';
  tabs.forEach(function(t) {
    var active = STATE.currentMarketTab === t.key ? ' active' : '';
    html += '<button class="market-tab' + active + '" data-mtab="' + t.key + '">' + t.label + '</button>';
  });
  html += '</div></div>';
  return html;
}

function renderMarketsBody(m) {
  if (STATE.currentMarketTab === 'popular') return renderMarketsPopular(m);
  if (STATE.currentMarketTab === 'match') return renderMarketsMatch(m);
  if (STATE.currentMarketTab === 'stats') return renderMarketsStats(m);
  return '';
}

/* ============ MARKETS: POPULAR ============ */
function renderMarketsPopular(m) {
  var html = '';
  var odds = computeOdds(m);

  // Исход
  var isTwoCol = (m.sport === 'ufc' || m.sport === 'volleyball');
  html += renderMarketCard('Исход', isTwoCol ?
    renderOddsTwo(odds.home, odds.away, m, ['home', 'away'], ['1', '2']) :
    renderOddsThree(odds.home, odds.draw, odds.away, m)
  );

  // Итоговая победа (только для футбола/хоккея)
  if (m.sport === 'football' || m.sport === 'hockey') {
    var p1 = odds.home ? 1 / odds.home : 0;
    var p2 = odds.away ? 1 / odds.away : 0;
    var tot = p1 + p2 || 1;
    var oddH = toOdd(p1 / tot, 0.06);
    var oddA = toOdd(p2 / tot, 0.06);
    html += renderMarketCard('Итоговая победа',
      '<div class="odds-grid-2">' +
        renderOddBtnInline(m, 'home', m.home, oddH) +
        renderOddBtnInline(m, 'away', m.away, oddA) +
      '</div>'
    );
  }

  // Второй тайм / итоговый победитель — специфика
  if (m.sport === 'football') {
    html += renderMarketCard('Исход 1-го тайма',
      renderOddsThree(
        toOdd(clamp((1 / (odds.home || 2)) * 1.4, 0.05, 0.95), 0.06),
        toOdd(0.28, 0.06),
        toOdd(clamp((1 / (odds.away || 2)) * 1.4, 0.05, 0.95), 0.06),
        m, ['home', 'draw', 'away']
      )
    );
  }

  // Тоталы (с селектором)
  html += renderMarketTotalGoals(m);

  // Форы (селектор)
  html += renderMarketHandicap(m);

  return html;
}

/* ============ MARKETS: MATCH (Основные + все тоталы) ============ */
function renderMarketsMatch(m) {
  var html = '';

  // Основные — Фора 1 / Фора 2 + Тотал
  var lineHcp = STATE.currentLine[m.id + '_hcp'] || 1.5;
  var lineTot = STATE.currentLine[m.id + '_tot'] || 2.5;

  html += renderMarketCard('Основные',
    '<div class="odds-labeled">' +
      '<div>' +
        '<div class="col-head">Фора 1</div>' +
        renderOddBtnInline(m, 'f1_' + lineHcp, '-' + lineHcp, toOdd(0.48, 0.05)) +
      '</div>' +
      '<div>' +
        '<div class="col-head">Фора 2</div>' +
        renderOddBtnInline(m, 'f2_' + lineHcp, '+' + lineHcp, toOdd(0.52, 0.05)) +
      '</div>' +
    '</div>' +
    '<div class="odds-labeled">' +
      '<div>' +
        '<div class="col-head">Тотал</div>' +
        renderOddBtnInline(m, 'tot_over_' + lineTot, 'Больше ' + lineTot, toOdd(0.52, 0.05)) +
      '</div>' +
      '<div>' +
        '<div class="col-head">&nbsp;</div>' +
        renderOddBtnInline(m, 'tot_under_' + lineTot, 'Меньше ' + lineTot, toOdd(0.48, 0.05)) +
      '</div>' +
    '</div>'
  );

  // Тотал голов с селектором
  html += renderMarketTotalGoals(m);

  // Исход с учётом форы — селектор
  html += renderMarketHandicap(m);

  // Точный счёт
  html += renderMarketCard('Точный счёт',
    '<div class="odds-grid-3">' +
      renderOddBtnInline(m, 'score_1_0', '1:0', toOdd(0.10, 0.08)) +
      renderOddBtnInline(m, 'score_1_1', '1:1', toOdd(0.11, 0.08)) +
      renderOddBtnInline(m, 'score_0_1', '0:1', toOdd(0.09, 0.08)) +
      renderOddBtnInline(m, 'score_2_1', '2:1', toOdd(0.08, 0.08)) +
      renderOddBtnInline(m, 'score_1_2', '1:2', toOdd(0.07, 0.08)) +
      renderOddBtnInline(m, 'score_2_0', '2:0', toOdd(0.07, 0.08)) +
    '</div>'
  );

  return html;
}

/* ============ MARKETS: STATS (показатели команд) ============ */
function renderMarketsStats(m) {
  var params = [
    {key:'fouls',   label:'Фолы'},
    {key:'corners', label:'Угловые'},
    {key:'cards',   label:'Жёлтые'},
    {key:'shots',   label:'Удары'},
    {key:'ontarget',label:'В створ'},
    {key:'offsides',label:'Офсайды'}
  ];

  var html = '<div class="stat-params">';
  params.forEach(function(p) {
    var active = STATE.currentStatParam === p.key ? ' active' : '';
    html += '<button class="stat-param' + active + '" data-stat-param="' + p.key + '">' + p.label + '</button>';
  });
  html += '</div>';

  // Данные по параметру
  var cntHome = 0, cntAway = 0;
  var label = '';
  if (STATE.currentStatParam === 'fouls') { cntHome = m.foulsHome; cntAway = m.foulsAway; label = 'ФОЛЫ'; }
  if (STATE.currentStatParam === 'corners') { cntHome = m.cornersHome; cntAway = m.cornersAway; label = 'УГЛОВЫЕ'; }
  if (STATE.currentStatParam === 'cards') { cntHome = m.cardsHome; cntAway = m.cardsAway; label = 'ЖЁЛТЫЕ'; }
  if (STATE.currentStatParam === 'shots') { cntHome = m.shotsHome || 0; cntAway = m.shotsAway || 0; label = 'УДАРЫ'; }
  if (STATE.currentStatParam === 'ontarget') { cntHome = m.shotsOnTargetHome || 0; cntAway = m.shotsOnTargetAway || 0; label = 'В СТВОР'; }
  if (STATE.currentStatParam === 'offsides') { cntHome = m.offsidesHome || 0; cntAway = m.offsidesAway || 0; label = 'ОФСАЙДЫ'; }

  html += '<div class="stat-counter">' +
    '<div class="cnt-h">' + cntHome + '</div>' +
    '<div class="lbl">' + label + '</div>' +
    '<div class="cnt-a">' + cntAway + '</div>' +
  '</div>';

  // Рынки для показателя
  var pHome = computeStatProb(cntHome, cntAway, m, STATE.currentStatParam);
  var pAway = 1 - pHome;
  var pDraw = 0.15;

  html += renderMarketCard('Исход',
    renderOddsThree(
      toOdd(pHome * (1 - pDraw), 0.06),
      toOdd(pDraw, 0.06),
      toOdd(pAway * (1 - pDraw), 0.06),
      m
    )
  );

  // Тотал с селектором
  var lines = getStatLines(STATE.currentStatParam);
  var currentLine = STATE.currentLine[m.id + '_stat_' + STATE.currentStatParam] || lines[Math.floor(lines.length / 2)];
  html += renderMarketCard('Тотал ' + label.toLowerCase(),
    '<div class="line-selector">' +
      lines.map(function(l) {
        var active = l === currentLine ? ' active' : '';
        return '<div class="line-opt' + active + '" data-stat-line="' + l + '">' + l + '</div>';
      }).join('') +
    '</div>' +
    '<div class="odds-grid-2">' +
      renderOddBtnInline(m, 'stat_' + STATE.currentStatParam + '_over_' + currentLine, 'Больше', toOdd(0.50, 0.05)) +
      renderOddBtnInline(m, 'stat_' + STATE.currentStatParam + '_under_' + currentLine, 'Меньше', toOdd(0.50, 0.05)) +
    '</div>'
  );

  return html;
}

function computeStatProb(cntH, cntA, m, param) {
  var total = cntH + cntA;
  if (total === 0) return 0.5;
  var base = cntH / total;
  return clamp(base, 0.1, 0.9);
}

function getStatLines(param) {
  if (param === 'fouls') return [20.5, 22.5, 24.5, 26.5];
  if (param === 'corners') return [6.5, 8.5, 10.5, 12.5];
  if (param === 'cards') return [1.5, 2.5, 3.5, 4.5];
  if (param === 'shots') return [18.5, 22.5, 26.5, 30.5];
  if (param === 'ontarget') return [6.5, 8.5, 10.5, 12.5];
  if (param === 'offsides') return [1.5, 2.5, 3.5, 4.5];
  return [1.5, 2.5, 3.5];
}

/* ============ MARKET CARD ============ */
function renderMarketCard(title, bodyHtml, opts) {
  opts = opts || {};
  var key = opts.key || title;
  var isOpen = STATE.openMarkets[key] !== false;
  var starActive = STATE.favorites[key] ? ' active' : '';
  return '' +
    '<div class="market-card' + (isOpen ? '' : ' collapsed') + '" data-market-key="' + escapeHtml(key) + '">' +
      '<div class="market-head" data-toggle-market="' + escapeHtml(key) + '">' +
        '<span class="star' + starActive + '" data-star-market="' + escapeHtml(key) + '">★</span>' +
        '<span class="title">' + escapeHtml(title) + '</span>' +
        '<span class="chevron">▲</span>' +
      '</div>' +
      '<div class="market-body">' + bodyHtml + '</div>' +
    '</div>';
}

function renderOddsThree(oddH, oddD, oddA, m) {
  var hasDraw = oddD !== null && oddD !== undefined;
  return '' +
    '<div class="odds-grid-3">' +
      renderOddBtnInline(m, 'home', '1', oddH) +
      (hasDraw ? renderOddBtnInline(m, 'draw', 'X', oddD) : '<div class="odd-btn disabled"></div>') +
      renderOddBtnInline(m, 'away', '2', oddA) +
    '</div>' +
    '<div class="odds-pair">' +
      renderOddBtnInline(m, '1X', '1X', combineOdds(oddH, oddD)) +
      renderOddBtnInline(m, '12', '12', combineOdds(oddH, oddA)) +
    '</div>' +
    '<div class="odds-pair" style="margin-top:6px">' +
      renderOddBtnInline(m, 'X2', 'X2', combineOdds(oddD, oddA)) +
      '<div class="odd-btn disabled"></div>' +
    '</div>';
}

function renderOddsTwo(oddH, oddA, m, picks, labels) {
  return '<div class="odds-grid-2">' +
    renderOddBtnInline(m, picks[0], labels[0], oddH) +
    renderOddBtnInline(m, picks[1], labels[1], oddA) +
  '</div>';
}

function combineOdds(o1, o2) {
  if (!o1 || !o2) return null;
  var p = (1 / o1) + (1 / o2);
  if (p >= 1) return null;
  return toOdd(1 - p, 0.04);
}

function renderOddBtnInline(m, pick, label, odd) {
  if (!isValid(odd)) return '<div class="odd-btn disabled"><span class="lbl">' + escapeHtml(label) + '</span><span class="val">—</span></div>';
  var isSel = isInCoupon(m.id, pick);
  return '<button class="odd-btn' + (isSel ? ' selected' : '') + '" data-match-id="' + m.id + '" data-pick="' + escapeHtml(pick) + '" data-odd="' + odd + '">' +
    '<span class="lbl">' + escapeHtml(label) + '</span>' +
    '<span class="val">' + odd.toFixed(2) + '</span>' +
  '</button>';
}

/* ============ MARKET: TOTAL GOALS (селектор) ============ */
function renderMarketTotalGoals(m) {
  var lines = m.sport === 'football' ? [1.5, 2, 2.5, 3, 3.5, 4] : [3.5, 4, 4.5, 5, 5.5, 6];
  var currentLine = STATE.currentLine[m.id + '_tot'] || 2.5;
  if (lines.indexOf(currentLine) < 0) currentLine = lines[Math.floor(lines.length / 2)];

  var pOver = 0.52;
  if (m.sport === 'football') {
    var lam = footballExpectedLambda(m, 'home') + footballExpectedLambda(m, 'away');
    var remain = m.maxMinute - m.minute;
    var totalLam = lam * remain / 90;
    pOver = 1 - normalCDF((currentLine - m.scoreHome - m.scoreAway - totalLam) / Math.max(0.5, Math.sqrt(totalLam)));
  }
  pOver = clamp(pOver, 0.05, 0.95);

  return renderMarketCard('Тотал голов',
    '<div class="line-selector">' +
      lines.map(function(l) {
        var active = Math.abs(l - currentLine) < 0.01 ? ' active' : '';
        return '<div class="line-opt' + active + '" data-total-line="' + l + '">' + l + '</div>';
      }).join('') +
    '</div>' +
    '<div class="odds-grid-2">' +
      renderOddBtnInline(m, 'tot_over_' + currentLine, 'Больше', toOdd(pOver, 0.05)) +
      renderOddBtnInline(m, 'tot_under_' + currentLine, 'Меньше', toOdd(1 - pOver, 0.05)) +
    '</div>'
  );
}

/* ============ MARKET: HANDICAP (селектор) ============ */
function renderMarketHandicap(m) {
  var lines = [0, 0.5, 1, 1.5, 2, 2.5];
  var currentLine = STATE.currentLine[m.id + '_hcp'] || 1.5;

  var pH = 0.5;
  if (m.sport === 'football' || m.sport === 'hockey') {
    var lamH = (m.sport === 'football' ? footballExpectedLambda(m, 'home') : hockeyExpectedLambda(m, 'home')) * (m.maxMinute - m.minute) / (m.sport === 'football' ? 90 : 60);
    var lamA = (m.sport === 'football' ? footballExpectedLambda(m, 'away') : hockeyExpectedLambda(m, 'away')) * (m.maxMinute - m.minute) / (m.sport === 'football' ? 90 : 60);
    var diff = m.scoreHome - m.scoreAway;
    var p = 0;
    for (var i = 0; i <= 8; i++) for (var j = 0; j <= 8; j++) {
      var pp = poisson(i, lamH) * poisson(j, lamA);
      if ((diff + i - j) > currentLine) p += pp;
    }
    pH = p;
  }
  pH = clamp(pH, 0.1, 0.9);

  return renderMarketCard('Исход с учётом форы',
    '<div class="line-selector">' +
      lines.map(function(l) {
        var active = Math.abs(l - currentLine) < 0.01 ? ' active' : '';
        return '<div class="line-opt' + active + '" data-hcp-line="' + l + '">' + l + '</div>';
      }).join('') +
    '</div>' +
    '<div class="odds-labeled">' +
      '<div>' +
        '<div class="col-head">' + escapeHtml(m.home) + '</div>' +
        renderOddBtnInline(m, 'hcp_home_' + currentLine, 'Фора (-' + currentLine + ')', toOdd(pH, 0.05)) +
      '</div>' +
      '<div>' +
        '<div class="col-head">' + escapeHtml(m.away) + '</div>' +
        renderOddBtnInline(m, 'hcp_away_' + currentLine, 'Фора (+' + currentLine + ')', toOdd(1 - pH, 0.05)) +
      '</div>' +
    '</div>'
  );
}

/* ============ ОБРАБОТЧИКИ — ГЛАВНЫЙ ЭКРАН ============ */
function bindMainScreen() {
  // Клик по строке матча
  document.querySelectorAll('.match-row').forEach(function(row) {
    row.addEventListener('click', function(e) {
      if (e.target.closest('.odd-cell')) return;
      var id = parseInt(this.dataset.matchId);
      openMatch(id);
    });
  });

  // Клик по кэфу
  document.querySelectorAll('.odd-cell[data-match-id]').forEach(function(cell) {
    cell.addEventListener('click', function(e) {
      e.stopPropagation();
      var mid = parseInt(this.dataset.matchId);
      var pick = this.dataset.pick;
      addToCouponFromCell(mid, pick);
    });
  });

  // Спорт-табы
  document.querySelectorAll('.sport-tab').forEach(function(t) {
    t.addEventListener('click', function() {
      STATE.currentSport = this.dataset.sport;
      renderMainScreen();
    });
  });

  // Фильтры
  document.querySelectorAll('.filter-chip').forEach(function(f) {
    f.addEventListener('click', function() {
      STATE.currentFilter = this.dataset.filter;
      renderMainScreen();
    });
  });

  // Show all
  var sa = $('btnShowAll');
  if (sa) sa.addEventListener('click', function() { toast('info', 'ℹ️', 'Показаны все события'); });

  // Кнопки хедера
  var b1 = $('btnAddFunds');
  if (b1) b1.addEventListener('click', showBonus);
  var b2 = $('btnProfile');
  if (b2) b2.addEventListener('click', function() { toast('info', '👤', 'Баланс: ' + fmt(STATE.wallet.balance) + ' ₽'); });
}

/* ============ ОБРАБОТЧИКИ — ЭКРАН МАТЧА ============ */
function bindMatchScreen() {
  // Назад
  var back = $('btnBack');
  if (back) back.addEventListener('click', function() {
    STATE.screen = 'main';
    renderApp();
  });

  // Кнопки хедера
  var b1 = $('btnAddFunds');
  if (b1) b1.addEventListener('click', showBonus);
  var b2 = $('btnProfile');
  if (b2) b2.addEventListener('click', function() { toast('info', '👤', 'Баланс: ' + fmt(STATE.wallet.balance) + ' ₽'); });

  // Market tabs
  document.querySelectorAll('.market-tab').forEach(function(t) {
    t.addEventListener('click', function() {
      STATE.currentMarketTab = this.dataset.mtab;
      renderMatchScreen();
    });
  });

  // Stat params
  document.querySelectorAll('.stat-param').forEach(function(p) {
    p.addEventListener('click', function() {
      STATE.currentStatParam = this.dataset.statParam;
      renderMatchScreen();
    });
  });

  // Line selectors
  document.querySelectorAll('[data-total-line]').forEach(function(li) {
    li.addEventListener('click', function() {
      STATE.currentLine[STATE.currentMatch.id + '_tot'] = parseFloat(this.dataset.totalLine);
      renderMatchScreen();
    });
  });
  document.querySelectorAll('[data-hcp-line]').forEach(function(li) {
    li.addEventListener('click', function() {
      STATE.currentLine[STATE.currentMatch.id + '_hcp'] = parseFloat(this.dataset.hcpLine);
      renderMatchScreen();
    });
  });
  document.querySelectorAll('[data-stat-line]').forEach(function(li) {
    li.addEventListener('click', function() {
      STATE.currentLine[STATE.currentMatch.id + '_stat_' + STATE.currentStatParam] = parseFloat(this.dataset.statLine);
      renderMatchScreen();
    });
  });

  // Collapse markets
  document.querySelectorAll('[data-toggle-market]').forEach(function(h) {
    h.addEventListener('click', function(e) {
      if (e.target.closest('[data-star-market]')) return;
      var key = this.dataset.toggleMarket;
      STATE.openMarkets[key] = !(STATE.openMarkets[key] !== false);
      renderMatchScreen();
    });
  });

  // Star markets
  document.querySelectorAll('[data-star-market]').forEach(function(s) {
    s.addEventListener('click', function(e) {
      e.stopPropagation();
      var key = this.dataset.starMarket;
      STATE.favorites[key] = !STATE.favorites[key];
      renderMatchScreen();
    });
  });

  // Кэфы
  document.querySelectorAll('.odd-btn[data-match-id]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (this.classList.contains('disabled')) return;
      var mid = parseInt(this.dataset.matchId);
      var pick = this.dataset.pick;
      var odd = parseFloat(this.dataset.odd);
      addToCouponFull(mid, pick, odd);
    });
  });
}

/* ============ ОТКРЫТИЕ МАТЧА ============ */
function openMatch(id) {
  var m = null;
  for (var i = 0; i < STATE.matches.length; i++) {
    if (STATE.matches[i].id === id) { m = STATE.matches[i]; break; }
  }
  if (!m) return;
  STATE.currentMatch = m;
  STATE.screen = 'match';
  STATE.currentMarketTab = 'popular';
  renderApp();
  window.scrollTo(0, 0);
}

/* ============ TAB BAR ============ */
function renderTabBar() {
  var tabs = [
    {key:'main',    icon:'🏠', label:'Главная'},
    {key:'sport',   icon:'⚽', label:'Спорт'},
    {key:'coupon',  icon:'📋', label:'Купон', badge: STATE.wallet.coupon.length || 0},
    {key:'games',   icon:'🎮', label:'Игры 24/7'},
    {key:'menu',    icon:'☰', label:'Меню'}
  ];
  var html = '<div class="tab-bar" id="tabBar">';
  tabs.forEach(function(t) {
    var active = (t.key === 'main' && STATE.screen === 'main') ||
                 (t.key === 'sport' && STATE.screen === 'match') ? ' active' : '';
    html += '<button class="tab-bar-item' + active + '" data-tab-key="' + t.key + '">' +
      '<span class="tab-icon">' + t.icon + '</span>' +
      '<span>' + t.label + '</span>' +
      (t.badge > 0 ? '<span class="badge">' + t.badge + '</span>' : '') +
    '</button>';
  });
  html += '</div>';
  var existing = $('tabBar');
  if (existing) existing.outerHTML = html;
  else $('app').insertAdjacentHTML('afterend', html);

  document.querySelectorAll('.tab-bar-item').forEach(function(t) {
    t.addEventListener('click', function() {
      var key = this.dataset.tabKey;
      if (key === 'coupon') {
        openCoupon();
      } else if (key === 'main') {
        STATE.screen = 'main';
        renderApp();
      } else if (key === 'sport') {
        toast('info', '⚽', 'Раздел Спорт');
      } else if (key === 'games') {
        toast('info', '🎮', 'Игры 24/7');
      } else if (key === 'menu') {
        toast('info', '☰', 'Меню');
      }
    });
  });
}

/* ============ FLOATING COUPON WIDGET ============ */
function renderFloatingCoupon() {
  var existing = $('floatingCoupon');
  if (existing) existing.remove();
  var c = STATE.wallet.coupon;
  if (!c.length) return;

  var last = c[c.length - 1];
  var m = null;
  for (var i = 0; i < STATE.matches.length; i++) if (STATE.matches[i].id === last.matchId) { m = STATE.matches[i]; break; }

  var html = '<div class="floating-coupon" id="floatingCoupon">' +
    '<div class="fc-icon">🅱</div>' +
    '<div class="fc-info">' +
      '<div class="fc-match">' + escapeHtml(last.matchName || 'Матч') + '</div>' +
      '<div class="fc-pick">' + escapeHtml(last.pickLabel || 'Ставка') + '</div>' +
    '</div>' +
    '<div class="fc-odd">' + last.odd.toFixed(2) + '</div>' +
  '</div>';

  document.body.insertAdjacentHTML('beforeend', html);
  var w = $('floatingCoupon');
  if (w) w.addEventListener('click', openCoupon);
}

/* ============ COUPON PANEL ============ */
function openCoupon() {
  $('couponPanel').classList.add('active');
  $('couponOverlay').classList.add('active');
  document.body.classList.add('coupon-open');
  renderCouponBody();
}
function closeCoupon() {
  $('couponPanel').classList.remove('active');
  $('couponOverlay').classList.remove('active');
  document.body.classList.remove('coupon-open');
}

function renderCouponBody() {
  var c = STATE.wallet.coupon;
  var html = '';

  if (!c.length) {
    html = '<div class="coupon-empty">' +
      '<div class="icon">📋</div>' +
      '<div class="txt">Купон пуст</div>' +
    '</div>';
    $('couponBody').innerHTML = html;
    return;
  }

  // Список ставок
  c.forEach(function(item, idx) {
    html += '<div class="coupon-item">' +
      '<div class="ci-head">' +
        '<span class="ci-score">' + (item.score || '0:0') + '</span>' +
        '<span class="ci-league">' + escapeHtml(item.matchName) + '</span>' +
        '<button class="ci-remove" data-remove-coupon="' + idx + '">×</button>' +
      '</div>' +
      '<div class="ci-pick">' +
        '<span>' + escapeHtml(item.pickLabel) + '</span>' +
        '<span class="ci-odd">' + item.odd.toFixed(2) + '</span>' +
      '</div>' +
    '</div>';
  });

  // Тип
  html += '<div class="coupon-type">' +
    '<button class="ct-btn active">Одинар</button>' +
    '<div class="swap">⇅</div>' +
  '</div>';

  // Сумма
  html += '<div class="coupon-stake">' +
    '<input type="number" class="stake-input" id="couponStakeInput" placeholder="Введите сумму">' +
    '<div class="stake-right">' +
      '<div class="balance-label">Баланс</div>' +
      '<div class="balance-val">' + fmt(STATE.wallet.balance) + ' ₽</div>' +
      '<div class="add-btn" id="couponAddFunds">+</div>' +
    '</div>' +
  '</div>';

  html += '<div class="coupon-limits">' +
    '<div class="lmt">min <b>30</b></div>' +
    '<div class="lmt">max <b>' + fmt(STATE.wallet.balance) + '</b></div>' +
    '<div class="settings-btn">⚙︎</div>' +
  '</div>';

  html += '<div class="coupon-actions">' +
    '<div class="potential">Возможный выигрыш <b id="couponPotential">—</b></div>' +
  '</div>';

  html += '<button class="coupon-place" id="couponPlace">Поставить</button>';

  $('couponBody').innerHTML = html;

  // Обработчики
  var inp = $('couponStakeInput');
  var pot = $('couponPotential');
  if (inp) {
    inp.addEventListener('input', function() {
      var v = parseFloat(this.value) || 0;
      var totalOdd = c.reduce(function(a, b) { return a * b.odd; }, 1);
      pot.textContent = v > 0 ? fmt(v * totalOdd) + ' ₽' : '—';
    });
  }
  document.querySelectorAll('[data-remove-coupon]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(this.dataset.removeCoupon);
      STATE.wallet.coupon.splice(idx, 1);
      saveWallet();
      renderCouponBody();
      renderFloatingCoupon();
      renderTabBar();
    });
  });
  var af = $('couponAddFunds');
  if (af) af.addEventListener('click', showBonus);
  var pl = $('couponPlace');
  if (pl) pl.addEventListener('click', placeCouponBet);
}

/* ============ COUPON LOGIC ============ */
function isInCoupon(matchId, pick) {
  return STATE.wallet.coupon.some(function(c) { return c.matchId === matchId && c.pick === pick; });
}

function addToCouponFromCell(matchId, pick) {
  var m = findMatch(matchId);
  if (!m) return;
  var odds = computeOdds(m);
  var odd = odds[pick];
  if (!isValid(odd)) return;
  addToCouponFull(matchId, pick, odd);
}

function addToCouponFull(matchId, pick, odd) {
  var m = findMatch(matchId);
  if (!m) return;
  if (isFinished(m) || m.status === 'countdown') return;

  if (isInCoupon(matchId, pick)) {
    STATE.wallet.coupon = STATE.wallet.coupon.filter(function(c) {
      return !(c.matchId === matchId && c.pick === pick);
    });
  } else {
    // убираем старые ставки на этот матч
    STATE.wallet.coupon = STATE.wallet.coupon.filter(function(c) { return c.matchId !== matchId; });
    var pickLabel = pickToLabel(m, pick);
    STATE.wallet.coupon.push({
      matchId: matchId,
      pick: pick,
      odd: odd,
      matchName: m.home + ' – ' + m.away,
      pickLabel: pickLabel,
      score: m.sport === 'volleyball' ? (m.setsHome + ':' + m.setsAway) : ((m.scoreHome || 0) + ':' + (m.scoreAway || 0))
    });
  }
  saveWallet();
  sBet(); vibe(15);
  renderFloatingCoupon();
  renderTabBar();
  if (STATE.screen === 'main') renderMainScreen();
  if (STATE.screen === 'match') renderMatchScreen();
  if ($('couponPanel').classList.contains('active')) renderCouponBody();
}

function pickToLabel(m, pick) {
  if (pick === 'home') return m.home;
  if (pick === 'away') return m.away;
  if (pick === 'draw') return 'Ничья';
  if (pick === '1X') return '1X';
  if (pick === '12') return '12';
  if (pick === 'X2') return 'X2';
  return pick;
}

function findMatch(id) {
  for (var i = 0; i < STATE.matches.length; i++) if (STATE.matches[i].id === id) return STATE.matches[i];
  return null;
}

function placeCouponBet() {
  var c = STATE.wallet.coupon;
  if (!c.length) return;
  var stake = parseFloat(($('couponStakeInput') || {}).value) || 0;
  if (stake < 30) { toast('lose', '⚠️', 'Минимум 30 ₽'); return; }
  if (stake > STATE.wallet.balance) { toast('lose', '⚠️', 'Недостаточно средств'); return; }

  var totalOdd = c.reduce(function(a, b) { return a * b.odd; }, 1);

  STATE.wallet.bets.unshift({
    id: Date.now(),
    type: c.length === 1 ? 'single' : 'express',
    selections: c.slice(),
    matchName: c.length === 1 ? c[0].matchName : ('Экспресс · ' + c.length),
    odd: totalOdd,
    stake: stake,
    potential: Math.round(stake * totalOdd * 100) / 100,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  STATE.wallet.balance -= stake;
  STATE.wallet.totalBet += stake;
  STATE.wallet.coupon = [];
  saveWallet();
  sBet(); vibe(20);
  toast('info', '📋', 'Ставка принята · ' + fmt(stake) + ' ₽');
  closeCoupon();
  renderTabBar();
  renderFloatingCoupon();
  if (STATE.screen === 'main') renderMainScreen();
  else renderMatchScreen();
  renderHistory();
  renderStats();
}

/* ============ BONUS ============ */
function showBonus() {
  if (STATE.wallet.lastBonus === todayKey()) {
    toast('info', '💎', 'Бонус уже получен');
    return;
  }
  STATE.wallet.balance += 100000;
  STATE.wallet.lastBonus = todayKey();
  saveWallet();
  sBonus(); vibe(80);
  toast('gold', '💎', '+100 000 ₽ бонус!');
  renderTabBar();
  if (STATE.screen === 'main') renderMainScreen();
  else renderMatchScreen();
}

/* ============ ИСТОРИЯ ============ */
function renderHistory() {
  // Пока заглушка — будет в следующем обновлении
}

function renderStats() {
  // Пока заглушка
}

/* ============ СОЗДАНИЕ МАТЧЕЙ ============ */
function createInitialMatches() {
  STATE.matches = [];
  STATE.nextId = 1;
  for (var i = 0; i < 4; i++) STATE.matches.push(newFootball());
  for (var j = 0; j < 3; j++) STATE.matches.push(newHockey());
  for (var k = 0; k < 3; k++) STATE.matches.push(newVolleyball());
  for (var l = 0; l < 3; l++) STATE.matches.push(newUFC());
  // перемешаем
  for (var q = STATE.matches.length - 1; q > 0; q--) {
    var r = Math.floor(Math.random() * (q + 1));
    var t = STATE.matches[q]; STATE.matches[q] = STATE.matches[r]; STATE.matches[r] = t;
  }
}

/* ============ ГЛАВНЫЙ ЦИКЛ ============ */
var tickCounter = 0;
function tick() {
  tickCounter++;

  // Симуляция
  for (var i = 0; i < STATE.matches.length; i++) {
    var m = STATE.matches[i];
    if (m.status === 'live' || m.status === 'countdown') {
      try { tickMatch(m); }
      catch (e) { console.error('tick err', m.id, e); m.status = 'finished'; }
    }
  }

  // Завершение — счётчик countdown
  for (var j = 0; j < STATE.matches.length; j++) {
    var m2 = STATE.matches[j];
    if (m2.status === 'finished' && !m2.countdownStarted) {
      m2.finishedAt = m2.finishedAt || Date.now();
      if (Date.now() - m2.finishedAt > 5000) {
        m2.countdownStarted = true;
        m2.status = 'countdown';
        m2.countdownLeft = 45;
      }
    }
  }

  // Добавление новых
  var liveCnt = STATE.matches.filter(function(mm) { return mm.status === 'live' || mm.status === 'countdown'; }).length;
  if (liveCnt < 10) {
    var cnt = {football: 0, hockey: 0, volleyball: 0, ufc: 0};
    STATE.matches.forEach(function(mm) {
      if ((mm.status === 'live' || mm.status === 'countdown') && cnt[mm.sport] !== undefined) cnt[mm.sport]++;
    });
    var targets = {football: 4, hockey: 3, volleyball: 3, ufc: 3};
    ['football', 'hockey', 'volleyball', 'ufc'].forEach(function(sp) {
      if (cnt[sp] < targets[sp]) {
        var need = targets[sp] - cnt[sp];
        for (var n = 0; n < need; n++) {
          if (sp === 'football') STATE.matches.push(newFootball());
          else if (sp === 'hockey') STATE.matches.push(newHockey());
          else if (sp === 'volleyball') STATE.matches.push(newVolleyball());
          else STATE.matches.push(newUFC());
        }
      }
    });
  }

  // Ограничение
  if (STATE.matches.length > 30) {
    STATE.matches = STATE.matches.slice(0, 30);
  }

  // Перерисовка раз в 2 секунды
  if (tickCounter % 2 === 0) {
    if (STATE.screen === 'main') renderMainScreen();
    else if (STATE.screen === 'match' && STATE.currentMatch) {
      // обновим только цифры времени/счёта, чтобы не сбрасывать скролл
      var m3 = findMatch(STATE.currentMatch.id);
      if (m3) {
        STATE.currentMatch = m3;
        if (tickCounter % 6 === 0) renderMatchScreen();
      }
    }
  }
}

/* ============ СТАРТ ============ */
function init() {
  initWallet();
  // Загружаем soundOn
  try {
    var s = localStorage.getItem('openbet_sound');
    if (s !== null) STATE.soundOn = s === '1';
  } catch (e) {}

  createInitialMatches();
  // прогреваем матчи — чтобы не с нуля
  STATE.matches.forEach(function(m) {
    var skip = rand(3, 25);
    for (var i = 0; i < skip && m.status === 'live'; i++) {
      try { tickMatch(m); } catch (e) {}
    }
  });

  renderApp();

  // Обработчики купона (панель)
  var co = $('couponOverlay');
  if (co) co.addEventListener('click', closeCoupon);
  var cc = $('couponClose');
  if (cc) cc.addEventListener('click', closeCoupon);

  // Купон — табы
  document.querySelectorAll('.ct').forEach(function(t) {
    t.addEventListener('click', function() {
      document.querySelectorAll('.ct').forEach(function(x) { x.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  // Тик
  setInterval(tick, 1000);

  console.log('✅ OpenBet запущен — ' + STATE.matches.length + ' матчей');
}

document.addEventListener('DOMContentLoaded', init);
