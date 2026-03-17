/* ======== CHARACTER CREATOR ======== */

(function () {
  'use strict';

  /* ---------- 预设数据 ---------- */
  const PRESET_AVATARS = [
    '🧙‍♂️', '🧝‍♀️', '🤖', '👽',
    '🦊', '🐉', '👻', '🧛',
    '🦹‍♂️', '🧚‍♀️', '🥷', '🧑‍🚀'
  ];

  const TRAIT_GROUPS = [
    { label: '性格', color: 'cyan', traits: ['温柔', '冷酷', '幽默', '神秘', '热情', '沉稳'] },
    { label: '能力', color: 'violet', traits: ['量子感知', '心灵感应', '时空跃迁', '暗物质操控', '星图导航', '意识投射'] },
    { label: '种族', color: 'emerald', traits: ['人类', '仿生人', '星灵族', '虚空行者', '龙裔', '机械生命'] },
    { label: '阵营', color: 'rose', traits: ['秩序守护', '混沌先锋', '中立观察', '星际游侠'] },
    { label: '背景', color: 'amber', traits: ['流浪者', '贵族', '赏金猎人', '学者', '商人', '叛军'] }
  ];

  /* ---------- 状态 ---------- */
  let currentStep = 0;
  const totalSteps = 3;
  let selectedAvatar = null;   // emoji string or image dataURL
  let avatarIsImage = false;
  let selectedTraits = [];
  let uploadedImage = null;

  /* ---------- DOM 引用 ---------- */
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  /* ---------- 初始化 ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderStep1();
    renderStep2();
    bindStepNav();
    bindAvatarUpload();
    bindFormPreview();
  });

  /* ========== STEP 1 — 基本信息 + 头像 ========== */
  function renderStep1() {
    // 预设头像网格
    const grid = $('#avatarGrid');
    if (!grid) return;
    grid.innerHTML = PRESET_AVATARS.map((e, i) =>
      `<div class="avatar-option" data-idx="${i}">${e}</div>`
    ).join('');

    grid.addEventListener('click', (ev) => {
      const opt = ev.target.closest('.avatar-option');
      if (!opt) return;
      $$('.avatar-option', grid).forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedAvatar = PRESET_AVATARS[+opt.dataset.idx];
      avatarIsImage = false;
      updateAvatarPreview();
    });
  }

  /* ========== STEP 2 — 特质选择 ========== */
  function renderStep2() {
    const container = $('#traitContainer');
    if (!container) return;
    container.innerHTML = TRAIT_GROUPS.map(g => `
      <div class="form-group">
        <label class="form-label">${g.label}</label>
        <div class="trait-tags">
          ${g.traits.map(t => `<span class="trait-tag" data-color="${g.color}" data-trait="${t}">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');

    container.addEventListener('click', (ev) => {
      const tag = ev.target.closest('.trait-tag');
      if (!tag) return;
      const trait = tag.dataset.trait;
      if (tag.classList.contains('selected')) {
        tag.classList.remove('selected');
        selectedTraits = selectedTraits.filter(t => t !== trait);
      } else {
        if (selectedTraits.length >= 8) return;         // 最多8个
        tag.classList.add('selected');
        selectedTraits.push(trait);
      }
    });
  }

  /* ========== 头像上传 ========== */
  function bindAvatarUpload() {
    const preview = $('#avatarPreview');
    const fileInput = $('#avatarFile');
    if (!preview || !fileInput) return;

    preview.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImage = e.target.result;
        selectedAvatar = uploadedImage;
        avatarIsImage = true;
        // 清除预设选中
        $$('.avatar-option').forEach(o => o.classList.remove('selected'));
        updateAvatarPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function updateAvatarPreview() {
    const preview = $('#avatarPreview');
    if (!preview) return;
    if (avatarIsImage && uploadedImage) {
      preview.innerHTML = `<img src="${uploadedImage}" alt="avatar"/>`;
    } else if (selectedAvatar) {
      preview.innerHTML = `<span style="font-size:5rem">${selectedAvatar}</span>`;
    }
  }

  /* ========== 实时预览 ========== */
  function bindFormPreview() {
    const nameInput = $('#charName');
    const titleInput = $('#charTitle');
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        const el = $('#previewName');
        if (el) el.textContent = nameInput.value || '未命名角色';
      });
    }
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const el = $('#previewTitle');
        if (el) el.textContent = titleInput.value || '星际旅者';
      });
    }
  }

  /* ========== 步骤导航 ========== */
  function bindStepNav() {
    const nextBtn = $('#nextStep');
    const prevBtn = $('#prevStep');
    const genBtn = $('#generateCard');

    if (nextBtn) nextBtn.addEventListener('click', () => goStep(currentStep + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goStep(currentStep - 1));
    if (genBtn) genBtn.addEventListener('click', generateCard);
  }

  function goStep(idx) {
    if (idx < 0 || idx >= totalSteps) return;

    // 简单校验
    if (currentStep === 0 && idx > currentStep) {
      const name = ($('#charName') || {}).value;
      if (!name || !name.trim()) {
        shakeField($('#charName'));
        return;
      }
    }

    currentStep = idx;
    // 更新步骤条
    $$('.step-item').forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i < currentStep) el.classList.add('done');
      if (i === currentStep) el.classList.add('active');
    });
    // 切换面板
    $$('.step-panel').forEach((p, i) => {
      p.classList.remove('active');
      if (i === currentStep) p.classList.add('active');
    });
    // 按钮显隐
    const prevBtn = $('#prevStep');
    const nextBtn = $('#nextStep');
    const genBtn = $('#generateCard');
    if (prevBtn) prevBtn.style.display = currentStep === 0 ? 'none' : '';
    if (nextBtn) nextBtn.style.display = currentStep === totalSteps - 1 ? 'none' : '';
    if (genBtn) genBtn.style.display = currentStep === totalSteps - 1 ? '' : 'none';
  }

  function shakeField(el) {
    if (!el) return;
    el.classList.add('shake');
    el.focus();
    setTimeout(() => el.classList.remove('shake'), 500);
  }

  /* ========== 生成角色卡 ========== */
  function generateCard() {
    const name = ($('#charName') || {}).value || '未命名角色';
    const title = ($('#charTitle') || {}).value || '星际旅者';
    const story = ($('#charStory') || {}).value || '一段尚未书写的星际传说…';
    const species = ($('#charSpecies') || {}).value || '未知';

    // 随机属性
    const stats = {
      power: Math.floor(Math.random() * 40) + 60,
      wisdom: Math.floor(Math.random() * 40) + 60,
      charm: Math.floor(Math.random() * 40) + 60
    };

    const card = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, title, story, species,
      avatar: selectedAvatar || '🧑‍🚀',
      avatarIsImage,
      traits: [...selectedTraits],
      stats,
      createdAt: new Date().toISOString()
    };

    // 保存到 localStorage
    saveCard(card);

    // 渲染结果
    renderResult(card);
  }

  function renderResult(card) {
    const resultArea = $('#resultArea');
    const creatorArea = $('#creatorArea');
    if (!resultArea || !creatorArea) return;

    creatorArea.style.display = 'none';
    resultArea.style.display = 'block';

    const avatarHTML = card.avatarIsImage
      ? `<img class="result-card-avatar" src="${card.avatar}" alt="${card.name}"/>`
      : `<div class="result-card-emoji">${card.avatar}</div>`;

    const traitsHTML = card.traits.map(t => `<span>${t}</span>`).join('');

    resultArea.innerHTML = `
      <div class="text-center mb-6">
        <p class="font-cyber text-xs tracking-[0.25em] text-cyan-400/60 mb-2">// 角色卡生成完毕</p>
        <h2 class="font-cyber text-2xl font-bold section-title">你的星际档案</h2>
      </div>
      <div class="result-card">
        ${avatarHTML}
        <div class="result-card-info">
          <div class="result-card-name">${card.name}</div>
          <div class="result-card-title">${card.title}</div>
          <div class="result-card-story">${card.story}</div>
          <div class="result-card-traits">${traitsHTML}</div>
          <div class="result-card-stats">
            <div class="result-card-stat">
              <div class="result-card-stat-value" style="color:#818cf8">${card.stats.power}</div>
              <div class="result-card-stat-label">战力</div>
            </div>
            <div class="result-card-stat">
              <div class="result-card-stat-value" style="color:#22d3ee">${card.stats.wisdom}</div>
              <div class="result-card-stat-label">智慧</div>
            </div>
            <div class="result-card-stat">
              <div class="result-card-stat-value" style="color:#a78bfa">${card.stats.charm}</div>
              <div class="result-card-stat-label">魅力</div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center gap-4 mt-8">
        <button id="createAnother" class="btn-neon font-cyber text-xs tracking-wider px-6 py-2">再创一个</button>
        <a href="dashboard.html" class="btn-neon font-cyber text-xs tracking-wider px-6 py-2" style="border-color:rgba(6,182,212,0.4);color:#67e8f9;">查看全部角色</a>
      </div>
    `;

    $('#createAnother').addEventListener('click', () => {
      resultArea.style.display = 'none';
      creatorArea.style.display = 'block';
      currentStep = 0;
      goStep(0);
    });
  }

  /* ========== localStorage ========== */
  function saveCard(card) {
    const cards = JSON.parse(localStorage.getItem('hello_characters') || '[]');
    cards.unshift(card);
    localStorage.setItem('hello_characters', JSON.stringify(cards));
  }

})();
