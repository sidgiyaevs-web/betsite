'use strict';

/* ================= ГЛАВНЫЙ МОДУЛЬ ================= */

document.addEventListener('DOMContentLoaded', () => {
  // Матчи
  const matches = loadOrBuildMatches();
  // Пользователь
  let user = activeUser();
  if (user) {
    const added = tryDailyDeposit(user);
    if (added) console.log('Ежедневный бонус +' + DAILY_BONUS);
    user = activeUser();
  }

  initUI(matches, user);
  refreshAll();
  startLoop();
});