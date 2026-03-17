/* ======== 认证页逻辑 ======== */

(function () {
  'use strict';

  const API = '/api/auth';

  // 如果已登录直接跳转
  if (localStorage.getItem('accessToken')) {
    window.location.href = '/dashboard.html';
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initPasswordToggles();
    initForms();
  });

  /* ---------- Tab 切换 ---------- */
  function initTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');
        clearMessages();
      });
    });
  }

  /* ---------- 密码可见 ---------- */
  function initPasswordToggles() {
    document.querySelectorAll('.pwd-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? eyeOffSVG() : eyeOnSVG();
      });
    });
  }

  function eyeOnSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
  function eyeOffSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  }

  /* ---------- 表单提交 ---------- */
  function initForms() {
    // 登录
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = loginForm.querySelector('[name="email"]').value.trim();
        const password = loginForm.querySelector('[name="password"]').value;

        if (!email || !password) {
          showMessage('loginMsg', '请填写所有字段', 'error');
          return;
        }

        const btn = loginForm.querySelector('.form-submit');
        setLoading(btn, true, '登录中…');

        try {
          const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();

          if (!data.success) {
            showMessage('loginMsg', data.message, 'error');
            setLoading(btn, false, '登 录');
            return;
          }

          // 保存 token 和用户信息
          saveAuth(data.data);
          showMessage('loginMsg', '登录成功，正在跳转…', 'success');
          setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
        } catch (err) {
          showMessage('loginMsg', '网络错误，请稍后再试', 'error');
          setLoading(btn, false, '登 录');
        }
      });
    }

    // 注册
    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const username = regForm.querySelector('[name="username"]').value.trim();
        const email = regForm.querySelector('[name="email"]').value.trim();
        const password = regForm.querySelector('[name="password"]').value;
        const password2 = regForm.querySelector('[name="password2"]').value;

        if (!username || !email || !password || !password2) {
          showMessage('regMsg', '请填写所有字段', 'error');
          return;
        }
        if (password !== password2) {
          showMessage('regMsg', '两次密码不一致', 'error');
          return;
        }
        if (password.length < 6) {
          showMessage('regMsg', '密码至少6位', 'error');
          return;
        }

        const btn = regForm.querySelector('.form-submit');
        setLoading(btn, true, '注册中…');

        try {
          const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
          });
          const data = await res.json();

          if (!data.success) {
            showMessage('regMsg', data.message, 'error');
            setLoading(btn, false, '注 册');
            return;
          }

          saveAuth(data.data);
          showMessage('regMsg', '注册成功，正在跳转…', 'success');
          setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
        } catch (err) {
          showMessage('regMsg', '网络错误，请稍后再试', 'error');
          setLoading(btn, false, '注 册');
        }
      });
    }
  }

  /* ---------- 辅助 ---------- */
  function saveAuth(data) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  function showMessage(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `form-message show ${type}`;
  }

  function clearMessages() {
    document.querySelectorAll('.form-message').forEach(el => {
      el.className = 'form-message';
      el.textContent = '';
    });
  }

  function setLoading(btn, loading, text) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner"></span>${text}`
      : text;
  }
})();
