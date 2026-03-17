/* ======== DASHBOARD ======== */

(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);

  document.addEventListener('DOMContentLoaded', async () => {
    // 真实鉴权：验证 token，失败跳转登录页
    const user = await Auth.requireAuth();
    if (!user) return; // requireAuth 会自动跳转

    renderUserInfo(user);
    renderCards();
    bindLogout();
  });

  /* ---------- 用户信息 ---------- */
  function renderUserInfo(user) {
    const nameEl = $('#userName');
    const emailEl = $('#userEmail');
    if (nameEl) nameEl.textContent = user.username || user.name || '旅者';
    if (emailEl) emailEl.textContent = user.email || '';
  }

  /* ---------- 角色卡列表 ---------- */
  function renderCards() {
    const cards = JSON.parse(localStorage.getItem('hello_characters') || '[]');
    const grid = $('#charGrid');
    const countEl = $('#charCount');
    const traitCountEl = $('#traitCount');
    if (!grid) return;

    if (countEl) countEl.textContent = cards.length;

    const totalTraits = cards.reduce((sum, c) => sum + (c.traits ? c.traits.length : 0), 0);
    if (traitCountEl) traitCountEl.textContent = totalTraits;

    if (cards.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <p>还没有创建角色</p>
          <a href="character.html" class="btn-neon font-cyber text-xs tracking-wider px-6 py-2">创建第一个角色</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = cards.map((card, idx) => {
      const avatarHTML = card.avatarIsImage
        ? `<img class="char-card-avatar" src="${card.avatar}" alt="${card.name}"/>`
        : `<div class="char-card-emoji">${card.avatar || '🧑‍🚀'}</div>`;

      const traitsHTML = (card.traits || []).slice(0, 4).map(t => `<span>${t}</span>`).join('');

      return `
        <div class="char-card reveal">
          ${avatarHTML}
          <div class="char-card-body">
            <div class="char-card-name">${card.name}</div>
            <div class="char-card-title">${card.title || '星际旅者'}</div>
            <div class="char-card-traits">${traitsHTML}</div>
            <div class="char-card-stats">
              <span><strong>${card.stats?.power || '—'}</strong>战力</span>
              <span><strong>${card.stats?.wisdom || '—'}</strong>智慧</span>
              <span><strong>${card.stats?.charm || '—'}</strong>魅力</span>
            </div>
            <div class="char-card-actions">
              <button onclick="viewCard(${idx})">查看</button>
              <button class="danger" onclick="deleteCard(${idx})">删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ---------- 查看详情 ---------- */
  window.viewCard = function (idx) {
    const cards = JSON.parse(localStorage.getItem('hello_characters') || '[]');
    const card = cards[idx];
    if (!card) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.style.backdropFilter = 'blur(8px)';

    const avatarHTML = card.avatarIsImage
      ? `<img class="result-card-avatar" src="${card.avatar}" alt="${card.name}"/>`
      : `<div class="result-card-emoji">${card.avatar || '🧑‍🚀'}</div>`;

    const traitsHTML = (card.traits || []).map(t => `<span>${t}</span>`).join('');

    modal.innerHTML = `
      <div class="result-card page-enter" style="max-height:90vh;overflow-y:auto;">
        ${avatarHTML}
        <div class="result-card-info">
          <div class="result-card-name">${card.name}</div>
          <div class="result-card-title">${card.title || '星际旅者'}</div>
          <div class="result-card-story">${card.story || '一段尚未书写的星际传说…'}</div>
          <div class="result-card-traits">${traitsHTML}</div>
          <div class="result-card-stats">
            <div class="result-card-stat">
              <div class="result-card-stat-value" style="color:#818cf8">${card.stats?.power || 0}</div>
              <div class="result-card-stat-label">战力</div>
            </div>
            <div class="result-card-stat">
              <div class="result-card-stat-value" style="color:#22d3ee">${card.stats?.wisdom || 0}</div>
              <div class="result-card-stat-label">智慧</div>
            </div>
            <div class="result-card-stat">
              <div class="result-card-stat-value" style="color:#a78bfa">${card.stats?.charm || 0}</div>
              <div class="result-card-stat-label">魅力</div>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  };

  /* ---------- 删除角色 ---------- */
  window.deleteCard = function (idx) {
    if (!confirm('确定要删除这个角色吗？此操作不可恢复。')) return;
    const cards = JSON.parse(localStorage.getItem('hello_characters') || '[]');
    cards.splice(idx, 1);
    localStorage.setItem('hello_characters', JSON.stringify(cards));
    renderCards();
  };

  /* ---------- 登出 ---------- */
  function bindLogout() {
    const btn = $('#logoutBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        await Auth.logout();
        window.location.href = 'login.html';
      });
    }
  }

})();
