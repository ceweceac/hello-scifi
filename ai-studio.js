/* ======== AI STUDIO ======== */

(function () {
  'use strict';

  let currentPanel = 0;

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  document.addEventListener('DOMContentLoaded', () => {
    bindSidebar();
    bindPanel0();
    bindPanel1();
    bindPanel2();
    bindPanel3();
  });

  /* ========== Sidebar 切换 ========== */
  function bindSidebar() {
    $$('.sidebar-item').forEach((item, idx) => {
      item.addEventListener('click', () => switchPanel(idx));
    });
  }

  function switchPanel(idx) {
    currentPanel = idx;
    $$('.sidebar-item').forEach((item, i) => {
      item.classList.remove('active');
      if (i === idx) item.classList.add('active');
    });
    $$('.studio-panel').forEach((panel, i) => {
      panel.classList.remove('active');
      if (i === idx) panel.classList.add('active');
    });
  }

  /* ========== 面板0 — 剧本分析 ========== */
  function bindPanel0() {
    const btn = $('#analyzeBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const input = $('#scriptInput');
      if (!input || !input.value.trim()) {
        input && input.focus();
        return;
      }
      simulateProcess(btn, '分析中…', () => {
        renderAnalysisResult(input.value.trim());
      });
    });
  }

  function renderAnalysisResult(text) {
    const output = $('#analysisOutput');
    if (!output) return;

    // 模拟 AI 分析结果
    const scenes = ['雨夜街道', '咖啡馆内景', '天台黄昏'];
    const characters = ['林默（男主）', '苏晚（女主）', '老陈（配角）'];
    const emotions = ['孤独', '期待', '释然', '温暖'];
    const actions = ['独行', '对话', '回忆', '拥抱'];

    output.innerHTML = `
      <div class="panel-section-title font-cyber">分析结果</div>
      <div class="mb-4">
        <p class="text-xs text-slate-500 mb-2">场景</p>
        <div>${scenes.map(s => `<span class="analysis-tag scene">${s}</span>`).join('')}</div>
      </div>
      <div class="mb-4">
        <p class="text-xs text-slate-500 mb-2">角色</p>
        <div>${characters.map(c => `<span class="analysis-tag char">${c}</span>`).join('')}</div>
      </div>
      <div class="mb-4">
        <p class="text-xs text-slate-500 mb-2">情绪基调</p>
        <div>${emotions.map(e => `<span class="analysis-tag emotion">${e}</span>`).join('')}</div>
      </div>
      <div class="mb-3">
        <p class="text-xs text-slate-500 mb-2">关键动作</p>
        <div>${actions.map(a => `<span class="analysis-tag action">${a}</span>`).join('')}</div>
      </div>
      <div class="prompt-block">
        <span class="hl">Prompt:</span> 请分析以下剧本，提取：\n- 场景列表（时间、地点、环境）\n- 角色信息（姓名、外貌、性格）\n- 分镜建议（镜头类型、景别、时长）\n\n<span class="hl">[剧本内容已输入 ${text.length} 字]</span>
      </div>
    `;
  }

  /* ========== 面板1 — 分镜生成 ========== */
  function bindPanel1() {
    const btn = $('#storyboardBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      simulateProcess(btn, '生成中…', renderStoryboard);
    });
  }

  function renderStoryboard() {
    const output = $('#storyboardOutput');
    if (!output) return;

    const shots = [
      { scene: '雨夜街道', type: '远景', desc: '雨中街道，路灯昏黄，主角独行', duration: 5 },
      { scene: '街角特写', type: '特写', desc: '雨滴落在主角肩头，表情凝重', duration: 3 },
      { scene: '咖啡馆', type: '中景', desc: '暖色灯光，女主角在窗边等待', duration: 4 },
      { scene: '对话', type: '过肩镜头', desc: '两人面对面，气氛微妙', duration: 6 },
      { scene: '回忆闪回', type: '蒙太奇', desc: '快速切换过去的温馨画面', duration: 4 },
      { scene: '天台黄昏', type: '大远景', desc: '城市天际线，夕阳西下，两人并肩', duration: 5 }
    ];

    output.innerHTML = `
      <div class="panel-section-title font-cyber">分镜脚本 — ${shots.length} 个镜头</div>
      <div class="shot-grid">
        ${shots.map((s, i) => `
          <div class="shot-card">
            <span class="shot-card-badge">#${i + 1} ${s.type}</span>
            <h5>${s.scene}</h5>
            <p>${s.desc}</p>
            <div class="shot-card-meta">
              <span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                ${s.duration}s
              </span>
              <span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/></svg>
                ${s.type}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="prompt-block mt-4">
        <span class="hl">JSON Output:</span>\n{\n  "shots": [\n    ${shots.map((s, i) => `{ "scene": "${s.scene}", "shotType": "${s.type}", "description": "${s.desc}", "duration": ${s.duration} }`).join(',\n    ')}\n  ]\n}
      </div>
    `;
  }

  /* ========== 面板2 — 图片生成 ========== */
  function bindPanel2() {
    const btn = $('#imageGenBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      simulateProcess(btn, '生成中…', renderImages);
    });
  }

  function renderImages() {
    const output = $('#imageOutput');
    if (!output) return;

    const imgs = [
      { label: '#1 雨夜街道 — 远景', prompt: 'Cinematic wide shot, rainy night street, dim streetlights, lonely atmosphere, film grain, 16:9' },
      { label: '#2 街角特写', prompt: 'Close-up shot, rain drops on shoulder, pensive expression, shallow depth of field' },
      { label: '#3 咖啡馆 — 中景', prompt: 'Medium shot, warm cafe interior, woman by window, golden hour lighting' },
      { label: '#4 对话 — 过肩', prompt: 'Over-the-shoulder shot, two people facing each other, subtle tension, bokeh background' },
      { label: '#5 回忆闪回', prompt: 'Montage style, warm memories, soft focus, vintage color grading' },
      { label: '#6 天台黄昏', prompt: 'Extreme wide shot, rooftop at sunset, city skyline, two silhouettes, golden light' }
    ];

    output.innerHTML = `
      <div class="panel-section-title font-cyber">生成图片 — ${imgs.length} 张</div>
      <div class="img-grid">
        ${imgs.map(img => `
          <div class="img-placeholder generated" title="${img.prompt}">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span style="font-size:0.6rem;text-align:center;padding:0 0.5rem;">${img.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="prompt-block mt-4">
        <span class="hl">Prompt 示例:</span>\n"${imgs[0].prompt}"
      </div>
    `;
  }

  /* ========== 面板3 — 角色一致性 ========== */
  function bindPanel3() {
    const btn = $('#consistencyBtn');
    const zone = $('#refUploadZone');
    const fileInput = $('#refFileInput');

    if (zone && fileInput) {
      zone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = $('#refPreview');
          if (preview) {
            const thumb = document.createElement('div');
            thumb.className = 'ref-thumb';
            thumb.innerHTML = `<img src="${e.target.result}" alt="ref"/>`;
            preview.appendChild(thumb);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (btn) {
      btn.addEventListener('click', () => {
        simulateProcess(btn, '处理中…', renderConsistencyResult);
      });
    }
  }

  function renderConsistencyResult() {
    const output = $('#consistencyOutput');
    if (!output) return;

    output.innerHTML = `
      <div class="panel-section-title font-cyber">一致性处理完成</div>
      <div class="mb-4">
        <p class="text-xs text-slate-400 mb-3">角色参考图已应用到所有分镜，确保角色外貌、服装、发型在各镜头间保持一致。</p>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <div class="ref-thumb mx-auto mb-1" style="width:80px;height:80px;">🧑</div>
            <p class="text-xs text-slate-500">参考图</p>
          </div>
          <div class="text-center">
            <div class="ref-thumb mx-auto mb-1" style="width:80px;height:80px;border-color:rgba(16,185,129,0.3);">✅</div>
            <p class="text-xs text-emerald-400">镜头 #1</p>
          </div>
          <div class="text-center">
            <div class="ref-thumb mx-auto mb-1" style="width:80px;height:80px;border-color:rgba(16,185,129,0.3);">✅</div>
            <p class="text-xs text-emerald-400">镜头 #3</p>
          </div>
        </div>
      </div>
      <div class="prompt-block">
        <span class="hl">技术方案:</span>\n• 使用 Reference Image 技术保持角色一致性\n• 先生成角色参考图，提取面部特征向量\n• 在每个分镜生成时注入参考特征\n• IP-Adapter / ControlNet Reference 模式
      </div>
    `;
  }

  /* ========== 通用：模拟处理 ========== */
  function simulateProcess(btn, loadingText, callback) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="process-spinner" style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px;"></span>${loadingText}`;

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = originalText;
      callback();
    }, 1800);
  }

})();
