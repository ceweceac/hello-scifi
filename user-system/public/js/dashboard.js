/* ======== 用户中心逻辑 ======== */

(function () {
  'use strict';

  const API = '/api/auth';
  let currentUser = null;

  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  });

  /* ---------- 鉴权 ---------- */
  async function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/index.html';
      return;
    }

    try {
      const res = await apiFetch(`${API}/me`);
      if (!res.success) throw new Error(res.message);
      currentUser = res.data.user;
      renderDashboard();
    } catch (err) {
      // 尝试刷新 token
      const refreshed = await tryRefresh();
      if (!refreshed) {
        clearAuth();
        window.location.href = '/index.html';
      }
    }
  }

  /* ---------- 刷新 token ---------- */
  async function tryRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (!data.success) return false;

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      // 重新获取用户
      const meRes = await apiFetch(`${API}/me`);
      if (meRes.success) {
        currentUser = meRes.data.user;
        renderDashboard();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /* ---------- 渲染 ---------- */
  function renderDashboard() {
    const app = document.getElementById('dashApp');
    if (!app) return;

    // 导航栏用户名
    const navName = document.getElementById('navUserName');
    if (navName) navName.textContent = currentUser.username;

    // 头像
    const avatar = currentUser.avatar
      ? `<img src="${currentUser.avatar}" alt="avatar"/>`
      : '👨‍🚀';

    const createdDate = new Date(currentUser.createdAt).toLocaleDateString('zh-CN');
    const lastLogin = currentUser.lastLoginAt
      ? new Date(currentUser.lastLoginAt).toLocaleString('zh-CN')
      : '—';

    app.innerHTML = `
      <!-- Header -->
      <div class="dash-header">
        <div class="dash-avatar">${avatar}</div>
        <div class="dash-user-info">
          <h2>${currentUser.username}</h2>
          <p>${currentUser.email}</p>
          <span class="role-badge">${currentUser.role === 'admin' ? '管理员' : '普通用户'}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="dash-stats">
        <div class="stat-card">
          <div class="stat-num">—</div>
          <div class="stat-label">AI 分镜项目</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="background:linear-gradient(135deg,#22d3ee,#06b6d4);-webkit-background-clip:text;background-clip:text;">—</div>
          <div class="stat-label">生成图片</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;background-clip:text;">∞</div>
          <div class="stat-label">创作灵感</div>
        </div>
      </div>

      <!-- 账户信息 -->
      <div class="dash-panel">
        <div class="dash-panel-title">账户信息</div>
        <div class="info-row"><span class="label">用户 ID</span><span class="value">#${currentUser.id}</span></div>
        <div class="info-row"><span class="label">用户名</span><span class="value">${currentUser.username}</span></div>
        <div class="info-row"><span class="label">邮箱</span><span class="value">${currentUser.email}</span></div>
        <div class="info-row"><span class="label">角色</span><span class="value">${currentUser.role === 'admin' ? '管理员' : '普通用户'}</span></div>
        <div class="info-row"><span class="label">注册时间</span><span class="value">${createdDate}</span></div>
        <div class="info-row"><span class="label">上次登录</span><span class="value">${lastLogin}</span></div>
      </div>

      <!-- 修改资料 -->
      <div class="dash-panel">
        <div class="dash-panel-title">修改资料</div>
        <div id="profileMsg" class="form-message"></div>
        <form id="profileForm">
          <div class="edit-group">
            <label class="edit-label">用户名</label>
            <input type="text" name="username" class="edit-input" value="${currentUser.username}" maxlength="30" />
          </div>
          <div class="edit-group">
            <label class="edit-label">头像 URL</label>
            <input type="url" name="avatar" class="edit-input" value="${currentUser.avatar || ''}" placeholder="https://example.com/avatar.jpg" />
          </div>
          <div class="btn-row">
            <button type="submit" class="btn-primary">保存修改</button>
          </div>
        </form>
      </div>

      <!-- 修改密码 -->
      <div class="dash-panel">
        <div class="dash-panel-title">修改密码</div>
        <div id="pwdMsg" class="form-message"></div>
        <form id="pwdForm">
          <div class="edit-group">
            <label class="edit-label">原密码</label>
            <input type="password" name="oldPassword" class="edit-input" />
          </div>
          <div class="edit-group">
            <label class="edit-label">新密码（至少6位，包含字母和数字）</label>
            <input type="password" name="newPassword" class="edit-input" />
          </div>
          <div class="btn-row">
            <button type="submit" class="btn-primary">修改密码</button>
          </div>
        </form>
      </div>

      <!-- 危险操作 -->
      <div class="dash-panel" style="border-color:rgba(244,63,94,0.12);">
        <div class="dash-panel-title" style="color:#fda4af;">退出登录</div>
        <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:1rem;">退出后需要重新登录才能访问用户中心</p>
        <button id="logoutBtn" class="btn-danger">退出登录</button>
      </div>
    `;

    bindProfileForm();
    bindPasswordForm();
    bindLogout();
  }

  /* ---------- 修改资料 ---------- */
  function bindProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = form.querySelector('[name="username"]').value.trim();
      const avatar = form.querySelector('[name="avatar"]').value.trim();

      const body = {};
      if (username && username !== currentUser.username) body.username = username;
      if (avatar !== (currentUser.avatar || '')) body.avatar = avatar || null;

      if (Object.keys(body).length === 0) {
        showMsg('profileMsg', '没有修改内容', 'error');
        return;
      }

      try {
        const res = await apiFetch(`${API}/profile`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        if (!res.success) {
          showMsg('profileMsg', res.message, 'error');
          return;
        }
        currentUser = res.data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        showToast('资���更新成功', 'success');
        renderDashboard();
      } catch (err) {
        showMsg('profileMsg', '网络错误', 'error');
      }
    });
  }

  /* ---------- 修改密码 ---------- */
  function bindPasswordForm() {
    const form = document.getElementById('pwdForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = form.querySelector('[name="oldPassword"]').value;
      const newPassword = form.querySelector('[name="newPassword"]').value;

      if (!oldPassword || !newPassword) {
        showMsg('pwdMsg', '请填写所有字段', 'error');
        return;
      }

      try {
        const res = await apiFetch(`${API}/change-password`, {
          method: 'PUT',
          body: JSON.stringify({ oldPassword, newPassword })
        });
        if (!res.success) {
          showMsg('pwdMsg', res.message, 'error');
          return;
        }
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        showToast('密码修改成功', 'success');
        form.reset();
      } catch (err) {
        showMsg('pwdMsg', '网络错误', 'error');
      }
    });
  }

  /* ---------- 登出 ---------- */
  function bindLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      try {
        await apiFetch(`${API}/logout`, { method: 'POST' });
      } catch { /* ignore */ }
      clearAuth();
      window.location.href = '/index.html';
    });
  }

  /* ---------- API 请求封装 ---------- */
  async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    // 如果 token 过期，尝试刷新
    if (res.status === 401) {
      const data = await res.json();
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await tryRefresh();
        if (refreshed) {
          // 重试原始请求
          return apiFetch(url, options);
        }
      }
      throw new Error('认证失败');
    }

    return res.json();
  }

  /* ---------- 辅助 ---------- */
  function clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  function showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `form-message show ${type}`;
  }

  function showToast(text, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
})();
