// ======== STARFIELD CANVAS ========
(function() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [], shootingStars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const STAR_COUNT = 600;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * 3000,
      y: Math.random() * 2000,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      color: (() => {
        const roll = Math.random();
        if (roll < 0.5) return '200,220,255';
        if (roll < 0.75) return '180,180,255';
        if (roll < 0.9) return '200,170,255';
        return '130,230,240';
      })()
    });
  }

  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * w * 0.8,
      y: Math.random() * h * 0.5,
      len: Math.random() * 80 + 60,
      speed: Math.random() * 8 + 6,
      angle: Math.PI / 6 + Math.random() * 0.3,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01
    });
  }
  setInterval(() => { if (Math.random() < 0.4) spawnShootingStar(); }, 2000);

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / w - 0.5) * 2;
    mouseY = (e.clientY / h - 0.5) * 2;
  });

  function drawStars(time) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const sx = s.x % w, sy = s.y % h;
      const flicker = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.3 + 0.7;
      const a = s.alpha * flicker;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color},${a})`;
      ctx.fill();
      if (s.r > 1.2) {
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${a * 0.1})`;
        ctx.fill();
      }
    }
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      const ex = ss.x + Math.cos(ss.angle) * ss.len;
      const ey = ss.y + Math.sin(ss.angle) * ss.len;
      const grad = ctx.createLinearGradient(ss.x, ss.y, ex, ey);
      grad.addColorStop(0, `rgba(255,255,255,${ss.alpha})`);
      grad.addColorStop(0.4, `rgba(180,190,255,${ss.alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(130,140,248,0)');
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.alpha -= ss.decay;
      if (ss.alpha <= 0 || ss.x > w || ss.y > h) shootingStars.splice(i, 1);
    }
  }

  function animate(time) {
    ctx.save();
    ctx.translate(mouseX * -5, mouseY * -5);
    drawStars(time / 1000);
    ctx.restore();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    for (const s of stars) { s.x = Math.random() * w; s.y = Math.random() * h; }
  });
})();

// ======== NAV SCROLL ========
(function() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
})();

// ======== MOBILE MENU ========
(function() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !mobileMenu) return;
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
})();

// ======== REVEAL ON SCROLL ========
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ======== COUNTER ANIMATION ========
(function() {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const isFloat = String(target).includes('.');
      const decimals = isFloat ? (String(target).split('.')[1] || '').length : 0;
      const duration = 2000;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = isFloat ? (target * ease).toFixed(decimals) : Math.floor(target * ease).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));
})();

// ======== SMOOTH SCROLL ========
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ======== DASHBOARD CHART ANIMATION ========
(function() {
  const bars = document.querySelectorAll('.chart-bar[data-height]');
  if (!bars.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.height = e.target.dataset.height;
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => {
    b.style.height = '0px';
    obs.observe(b);
  });
})();

// ======== LIVE CLOCK ========
(function() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  function tick() {
    const now = new Date();
    el.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }
  tick();
  setInterval(tick, 1000);
})();

// ======== SIMULATED LOG STREAM ========
(function() {
  const container = document.getElementById('log-stream');
  if (!container) return;
  const messages = [
    { text: '量子链路已建立 — 第七星区中继站上线', type: 'log-success' },
    { text: '曲速场校准：正常（偏差 0.003%）', type: '' },
    { text: '接收到信号：深空探测器 Alpha-9', type: 'log-success' },
    { text: '警告：在矢量 274.3 检测到微型小行星', type: 'log-warn' },
    { text: '护盾谐波已调整 — 共振稳定', type: '' },
    { text: '暗物质传感器扫描完成 — 未发现异常', type: '' },
    { text: '导航更新：新增 3 个航路点', type: 'log-success' },
    { text: '错误：时间同步偏移超过 0.02ms', type: 'log-error' },
    { text: '自动修正已应用 — 偏移已补偿', type: 'log-success' },
    { text: '船员清单已更新 — 2,048 个活跃节点', type: '' },
    { text: '超光速驱动冷却液��力：98.7% 最优', type: '' },
    { text: '警告：第三星区检测到太阳耀斑活动', type: 'log-warn' },
  ];
  let idx = 0;
  function addLog() {
    const msg = messages[idx % messages.length];
    const time = new Date().toISOString().substring(11, 19);
    const div = document.createElement('div');
    div.className = 'log-entry ' + msg.type;
    div.innerHTML = `<span class="text-slate-500">[${time}]</span> <span class="text-slate-300">${msg.text}</span>`;
    container.prepend(div);
    if (container.children.length > 20) container.removeChild(container.lastChild);
    idx++;
  }
  for (let i = 0; i < 6; i++) { addLog(); }
  setInterval(addLog, 3000);
})();

// ======== AUTH MODAL (LOGIN / REGISTER) — 连接真实 API ========
(function() {
  // Inject modal HTML
  const modalHTML = `
  <div id="authOverlay" class="auth-overlay">
    <div class="auth-backdrop" id="authBackdrop"></div>
    <div class="auth-panel">
      <button class="auth-close" id="authClose">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>
      </button>

      <!-- Logo -->
      <div style="text-align:center; margin-bottom:1.25rem;">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg,#818cf8,#7c3aed); margin-bottom:0.75rem;">
          <span class="font-cyber" style="font-size:11px; font-weight:900; color:#fff;">Hi</span>
        </div>
        <p class="font-cyber" style="font-size:0.7rem; letter-spacing:0.15em; color:rgba(129,140,248,0.6);">// 身份验证</p>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs font-cyber">
        <button class="auth-tab active" data-tab="login">登录</button>
        <button class="auth-tab" data-tab="register">注册</button>
      </div>

      <!-- Error / Success message -->
      <div id="authMsg" class="auth-msg" style="display:none;"></div>

      <!-- Login Form -->
      <form id="loginForm" class="auth-form active" autocomplete="off">
        <div class="auth-field">
          <label class="auth-label font-cyber">邮箱</label>
          <input type="email" class="auth-input" placeholder="请输入邮箱地址" required />
        </div>
        <div class="auth-field">
          <label class="auth-label font-cyber">密码</label>
          <div class="password-wrapper">
            <input type="password" class="auth-input" placeholder="请输入密码" required />
            <button type="button" class="password-toggle" tabindex="-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="captcha-row">
          <div class="auth-field">
            <label class="auth-label font-cyber">验证码</label>
            <input type="text" class="auth-input" placeholder="请输入验证码" required maxlength="4" style="text-transform:uppercase;" />
          </div>
          <div class="captcha-box" title="点击刷新验证码">
            <canvas id="captchaLogin" width="120" height="42"></canvas>
          </div>
        </div>
        <button type="submit" class="auth-submit font-cyber">登 录</button>
      </form>

      <!-- Register Form -->
      <form id="registerForm" class="auth-form" autocomplete="off">
        <div class="auth-field">
          <label class="auth-label font-cyber">用户名</label>
          <input type="text" class="auth-input" placeholder="请输入用户名（2-20字符）" required minlength="2" maxlength="20" />
        </div>
        <div class="auth-field">
          <label class="auth-label font-cyber">邮箱</label>
          <input type="email" class="auth-input" placeholder="请输入邮箱地址" required />
        </div>
        <div class="auth-field">
          <label class="auth-label font-cyber">密码</label>
          <div class="password-wrapper">
            <input type="password" class="auth-input" placeholder="请设置密码（至少6位）" required minlength="6" />
            <button type="button" class="password-toggle" tabindex="-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="auth-field">
          <label class="auth-label font-cyber">确认密码</label>
          <div class="password-wrapper">
            <input type="password" class="auth-input" placeholder="请再次输入密码" required />
            <button type="button" class="password-toggle" tabindex="-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="captcha-row">
          <div class="auth-field">
            <label class="auth-label font-cyber">验证码</label>
            <input type="text" class="auth-input" placeholder="请输入验证码" required maxlength="4" style="text-transform:uppercase;" />
          </div>
          <div class="captcha-box" title="点击刷新验证码">
            <canvas id="captchaRegister" width="120" height="42"></canvas>
          </div>
        </div>
        <button type="submit" class="auth-submit font-cyber">注 册</button>
      </form>

      <div class="auth-divider"><span class="font-cyber">安全通道</span></div>
      <p style="text-align:center; font-size:0.65rem; color:#475569; letter-spacing:0.05em;">由 AES-Q 512位量子加密协议保护</p>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const overlay = document.getElementById('authOverlay');
  const backdrop = document.getElementById('authBackdrop');
  const closeBtn = document.getElementById('authClose');
  const tabs = overlay.querySelectorAll('.auth-tab');
  const forms = overlay.querySelectorAll('.auth-form');
  const authMsg = document.getElementById('authMsg');

  // Store captcha codes
  const captchaCodes = { login: '', register: '' };

  // ---- Message display ----
  function showMsg(text, type) {
    authMsg.textContent = text;
    authMsg.className = 'auth-msg auth-msg-' + type;
    authMsg.style.display = 'block';
    clearTimeout(authMsg._timer);
    authMsg._timer = setTimeout(() => { authMsg.style.display = 'none'; }, 5000);
  }

  function hideMsg() {
    authMsg.style.display = 'none';
  }

  // ---- Captcha generator ----
  function generateCaptcha(canvasId, key) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 120, H = 42;
    ctx.clearRect(0, 0, W, H);

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, 'rgba(2,6,23,0.9)');
    bgGrad.addColorStop(1, 'rgba(15,23,42,0.9)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `rgba(99,102,241,${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,92,246,${Math.random() * 0.4})`;
      ctx.fill();
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    ctx.font = 'bold 20px Orbitron, monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 4; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      code += ch;
      const x = 18 + i * 25;
      const y = H / 2 + (Math.random() - 0.5) * 8;
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.shadowColor = 'rgba(129,140,248,0.6)';
      ctx.shadowBlur = 6;
      const colors = ['#818cf8', '#a5b4fc', '#22d3ee', '#a78bfa'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }

    captchaCodes[key] = code;
  }

  // ---- Open / Close ----
  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    hideMsg();
    generateCaptcha('captchaLogin', 'login');
    generateCaptcha('captchaRegister', 'register');
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    hideMsg();
  }

  // ---- Trigger: avatar button opens modal (guest) or dropdown (logged in) ----
  document.querySelectorAll('.user-avatar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        toggleUserDropdown(btn);
      } else {
        openModal();
      }
    });
  });

  backdrop.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // ---- Tab switching ----
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      forms.forEach(f => {
        f.classList.toggle('active', f.id === (target + 'Form'));
      });
      hideMsg();
    });
  });

  // ---- Password toggle ----
  overlay.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('.auth-input');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  });

  // ---- Captcha refresh on click ----
  overlay.querySelectorAll('.captcha-box').forEach(box => {
    box.addEventListener('click', () => {
      const canvas = box.querySelector('canvas');
      const key = canvas.id === 'captchaLogin' ? 'login' : 'register';
      generateCaptcha(canvas.id, key);
    });
  });

  // ---- Button state helpers ----
  function setBtnLoading(btn, text) {
    btn.textContent = text;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';
  }
  function setBtnSuccess(btn, text) {
    btn.textContent = text;
    btn.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(52,211,153,0.3))';
    btn.style.borderColor = 'rgba(52,211,153,0.5)';
    btn.style.color = '#6ee7b7';
  }
  function resetBtn(btn, text) {
    btn.textContent = text;
    btn.style = '';
  }

  // ---- Login Form → 真实 API ----
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('.auth-input');
    const email = inputs[0].value.trim();
    const password = inputs[1].value;
    const captchaInput = inputs[2].value.toUpperCase();

    if (captchaInput !== captchaCodes.login) {
      shakeInput(inputs[2]);
      generateCaptcha('captchaLogin', 'login');
      inputs[2].value = '';
      showMsg('验证码错误', 'error');
      return;
    }

    const btn = e.target.querySelector('.auth-submit');
    setBtnLoading(btn, '验证中...');
    hideMsg();

    try {
      const data = await Auth.login(email, password);
      if (data.success) {
        setBtnSuccess(btn, '登录成功');
        setTimeout(() => {
          closeModal();
          resetBtn(btn, '登 录');
          e.target.reset();
          updateAuthUI();
        }, 800);
      } else {
        showMsg(data.message || '登录失败', 'error');
        resetBtn(btn, '登 录');
        generateCaptcha('captchaLogin', 'login');
        inputs[2].value = '';
      }
    } catch (err) {
      showMsg('网络错误，请稍后重试', 'error');
      resetBtn(btn, '登 录');
    }
  });

  // ---- Register Form → 真实 API ----
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('.auth-input');
    const username = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const password = inputs[2].value;
    const confirm = inputs[3].value;
    const captchaInput = inputs[4].value.toUpperCase();

    if (password !== confirm) {
      shakeInput(inputs[3]);
      showMsg('两次密码不一致', 'error');
      return;
    }
    if (captchaInput !== captchaCodes.register) {
      shakeInput(inputs[4]);
      generateCaptcha('captchaRegister', 'register');
      inputs[4].value = '';
      showMsg('验证码错误', 'error');
      return;
    }

    const btn = e.target.querySelector('.auth-submit');
    setBtnLoading(btn, '注册中...');
    hideMsg();

    try {
      const data = await Auth.register(username, email, password);
      if (data.success) {
        setBtnSuccess(btn, '注册成功');
        setTimeout(() => {
          closeModal();
          resetBtn(btn, '注 册');
          e.target.reset();
          updateAuthUI();
        }, 800);
      } else {
        showMsg(data.message || '注册失败', 'error');
        resetBtn(btn, '注 册');
        generateCaptcha('captchaRegister', 'register');
        inputs[4].value = '';
      }
    } catch (err) {
      showMsg('网络错误，请稍后重试', 'error');
      resetBtn(btn, '注 册');
    }
  });

  function shakeInput(input) {
    input.style.borderColor = 'rgba(248,113,113,0.5)';
    input.style.animation = 'none';
    input.offsetHeight;
    input.style.animation = 'shake 400ms ease';
    setTimeout(() => { input.style.borderColor = ''; input.style.animation = ''; }, 500);
  }

  // Inject shake keyframe
  const style = document.createElement('style');
  style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`;
  document.head.appendChild(style);

  // Initial captcha generation
  generateCaptcha('captchaLogin', 'login');
  generateCaptcha('captchaRegister', 'register');

  // ============ LOGGED-IN STATE UI ============

  // User dropdown menu (injected once)
  const dropdownHTML = `
  <div id="userDropdown" class="user-dropdown">
    <div class="user-dropdown-header">
      <div class="user-dropdown-avatar" id="dropdownAvatar">U</div>
      <div>
        <div class="user-dropdown-name font-cyber" id="dropdownName">用户</div>
        <div class="user-dropdown-email" id="dropdownEmail">user@example.com</div>
      </div>
    </div>
    <div class="user-dropdown-divider"></div>
    <button class="user-dropdown-item" id="btnLogout">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      退出登录
    </button>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', dropdownHTML);

  const dropdown = document.getElementById('userDropdown');

  function toggleUserDropdown(anchorBtn) {
    if (dropdown.classList.contains('open')) {
      dropdown.classList.remove('open');
      return;
    }
    // Position near the button
    const rect = anchorBtn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 8) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.classList.add('open');

    // Fill user info
    const user = Auth.getUser();
    if (user) {
      document.getElementById('dropdownName').textContent = user.username || '用户';
      document.getElementById('dropdownEmail').textContent = user.email || '';
      document.getElementById('dropdownAvatar').textContent = (user.username || 'U')[0].toUpperCase();
    }
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !e.target.closest('.user-avatar-btn')) {
      dropdown.classList.remove('open');
    }
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', async () => {
    dropdown.classList.remove('open');
    await Auth.logout();
    updateAuthUI();
  });

  // ---- Update all avatar buttons based on login state ----
  function updateAuthUI() {
    const loggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();
    const user = loggedIn ? Auth.getUser() : null;

    document.querySelectorAll('.user-avatar-btn').forEach(btn => {
      if (loggedIn && user) {
        const initial = (user.username || 'U')[0].toUpperCase();
        btn.innerHTML = `<span class="avatar-initial">${initial}</span>`;
        btn.title = user.username || '用户中心';
        btn.classList.add('logged-in');
      } else {
        btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>';
        btn.title = '登录 / 注册';
        btn.classList.remove('logged-in');
      }
    });
  }

  // Expose globally so other scripts can call it
  window.updateAuthUI = updateAuthUI;

  // On page load: check auth state
  updateAuthUI();
})();
