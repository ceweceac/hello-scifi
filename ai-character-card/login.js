/* ======== LOGIN PAGE ======== */

(function () {
  'use strict';

  let captchaText = '';

  document.addEventListener('DOMContentLoaded', () => {
    // 已登录则跳转 dashboard
    if (Auth.isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return;
    }
    initTabs();
    initCaptcha();
    initPasswordToggles();
    initForms();
  });

  /* ---------- Tab 切换 ---------- */
  function initTabs() {
    const tabs = document.querySelectorAll('.login-tab');
    const forms = document.querySelectorAll('.login-form');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');
        generateCaptcha();
      });
    });
  }

  /* ---------- 验证码 ---------- */
  function initCaptcha() {
    document.querySelectorAll('.captcha-canvas').forEach(canvas => {
      canvas.addEventListener('click', generateCaptcha);
    });
    generateCaptcha();
  }

  function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    captchaText = '';
    for (let i = 0; i < 4; i++) captchaText += chars[Math.floor(Math.random() * chars.length)];

    document.querySelectorAll('.captcha-canvas').forEach(canvas => {
      const ctx = canvas.getContext('2d');
      const w = canvas.width = 110;
      const h = canvas.height = 42;

      ctx.fillStyle = 'rgba(2,6,23,0.8)';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.strokeStyle = `rgba(99,102,241,${0.15 + Math.random() * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${0.2 + Math.random() * 0.2})`;
        ctx.fill();
      }

      ctx.font = 'bold 20px Orbitron, monospace';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < captchaText.length; i++) {
        ctx.save();
        const x = 15 + i * 22;
        const y = h / 2 + (Math.random() - 0.5) * 8;
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        const colors = ['#818cf8', '#a78bfa', '#67e8f9', '#6ee7b7'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillText(captchaText[i], 0, 0);
        ctx.restore();
      }
    });
  }

  /* ---------- 密码可见 ---------- */
  function initPasswordToggles() {
    document.querySelectorAll('.pwd-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      });
    });
  }

  /* ---------- 表单提交 ---------- */
  function initForms() {
    // 登录
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('[name="email"]').value.trim();
        const pwd = loginForm.querySelector('[name="password"]').value;
        const cap = loginForm.querySelector('[name="captcha"]').value.trim().toUpperCase();

        clearErrors(loginForm);

        if (!email) return showError(loginForm, '请输入邮箱');
        if (!pwd) return showError(loginForm, '请输入密码');
        if (cap !== captchaText) {
          generateCaptcha();
          return showError(loginForm, '验证码错误');
        }

        const btn = loginForm.querySelector('.login-submit');
        btn.disabled = true;
        btn.textContent = '验证中…';

        try {
          const data = await Auth.login(email, pwd);
          if (data.success) {
            btn.textContent = '登录成功';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
          } else {
            btn.disabled = false;
            btn.textContent = '登 录';
            generateCaptcha();
            loginForm.querySelector('[name="captcha"]').value = '';
            showError(loginForm, data.message || '登录失败');
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = '登 录';
          generateCaptcha();
          showError(loginForm, '网络错误，请检查服务是否启动');
        }
      });
    }

    // 注册
    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = regForm.querySelector('[name="username"]').value.trim();
        const email = regForm.querySelector('[name="email"]').value.trim();
        const pwd = regForm.querySelector('[name="password"]').value;
        const pwd2 = regForm.querySelector('[name="password2"]').value;
        const cap = regForm.querySelector('[name="captcha"]').value.trim().toUpperCase();

        clearErrors(regForm);

        if (!username || username.length < 2) return showError(regForm, '请输入星际代号（至少2个字符）');
        if (!email) return showError(regForm, '请输入邮箱');
        if (!pwd || pwd.length < 6) return showError(regForm, '密码至少6位');
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(pwd)) return showError(regForm, '密码需包含字母和数字');
        if (pwd !== pwd2) return showError(regForm, '两次密码不一致');
        if (cap !== captchaText) {
          generateCaptcha();
          return showError(regForm, '验证码错误');
        }

        const btn = regForm.querySelector('.login-submit');
        btn.disabled = true;
        btn.textContent = '注册中…';

        try {
          const data = await Auth.register(username, email, pwd);
          if (data.success) {
            btn.textContent = '注册成功';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
          } else {
            btn.disabled = false;
            btn.textContent = '注 册';
            generateCaptcha();
            regForm.querySelector('[name="captcha"]').value = '';
            showError(regForm, data.message || '注册失败');
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = '注 册';
          generateCaptcha();
          showError(regForm, '网络错误，请检查服务是否启动');
        }
      });
    }
  }

  function showError(form, msg) {
    const el = form.querySelector('.login-error');
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }
  function clearErrors(form) {
    const el = form.querySelector('.login-error');
    if (el) { el.textContent = ''; el.classList.remove('show'); }
  }

})();
