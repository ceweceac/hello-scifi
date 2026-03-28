(function () {
  'use strict';

  /* ===================== 节点类型定义 ===================== */
  const NODE_DEFS = {
    script:    { label:'故事脚本生成', color:'#818cf8', fields:[{type:'textarea',key:'content',label:'剧本内容',placeholder:'输入剧本…'}], runnable:true },
    character: { label:'角色三视图',   color:'#34d399', fields:[{type:'select',key:'method',label:'生成方案',options:['IP-Adapter','ControlNet','LoRA']}], runnable:true },
    imagegen:  { label:'智能图生视频', color:'#f43f5e', fields:[{type:'select',key:'engine',label:'引擎',options:['Sora','Runway','Pika']},{type:'select',key:'style',label:'风格',options:['写实','赛博朋克','动画']}], runnable:true },
    video:     { label:'音频视频',     color:'#c084fc', fields:[{type:'select',key:'format',label:'格式',options:['MP4','MOV','WebM']}], runnable:true },
    prompt:    { label:'提示词',       color:'#fbbf24', fields:[{type:'textarea',key:'prompt',label:'Prompt',placeholder:'描述画面…'}] },
    analyze:   { label:'剧本分析',     color:'#22d3ee', fields:[{type:'select',key:'model',label:'模型',options:['GPT-4','Claude','Gemini']}], runnable:true },
  };

  /* ===================== 状态 ===================== */
  let panX = 0, panY = 0, zoom = 1;
  let nodes = [];   // {id, type, x, y, el}
  let conns = [];   // {from, to}  from/to = nodeId + ':input/:output
  let nodeIdSeq = 0;
  let selectedNodeId = null;

  // 连线拖拽状态
  let draggingConn = null; // {fromId, x1, y1}
  let tempPath = null;

  // 节点拖拽状态
  let draggingNode = null; // {id, startMouseX, startMouseY, startNodeX, startNodeY}

  // 画布平移拖拽状态
  let draggingCanvas = false;
  let dragStartX = 0, dragStartY = 0;
  let dragStartPanX = 0, dragStartPanY = 0;

  // 卡片拖拽状态
  let cardDrag = null; // {type, ghost}

  // 右键菜单目标
  let ctxTargetId = null;

  /* ===================== DOM 引用 ===================== */
  const canvasArea = document.getElementById('canvasArea');
  const workspace  = document.getElementById('workspace');
  const connSvg    = document.getElementById('connSvg');
  const grid       = document.getElementById('grid');
  const canvasHint = document.getElementById('canvasHint');
  const ctxMenu    = document.getElementById('ctxMenu');
  const zoomVal    = document.getElementById('zoomVal');
  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const toolbar    = document.getElementById('toolbar');
  const bottomBar  = document.getElementById('bottomBar');

  /* ===================== 变换应用 ===================== */
  function applyTransform() {
    const t = `translate(${panX}px,${panY}px) scale(${zoom})`;
    workspace.style.transform = t;
    connSvg.style.transform   = t;
    if (grid) {
      grid.style.backgroundPosition = `${panX}px ${panY}px`;
      grid.style.backgroundSize = `${40*zoom}px ${40*zoom}px`;
    }
    if (zoomVal) zoomVal.textContent = Math.round(zoom * 100) + '%';
  }

  /* ===================== 坐标转换 ===================== */
  function screenToCanvas(sx, sy) {
    const rect = canvasArea.getBoundingClientRect();
    return {
      x: (sx - rect.left - panX) / zoom,
      y: (sy - rect.top  - panY) / zoom,
    };
  }

  /* ===================== 节点创建 ===================== */
  function createNode(type, cx, cy) {
    const def = NODE_DEFS[type];
    if (!def) return;
    const id = 'node_' + (++nodeIdSeq);

    const el = document.createElement('div');
    el.className = 'cv-node';
    el.id = id;
    el.style.left = cx + 'px';
    el.style.top  = cy + 'px';
    el.style.borderColor = def.color;

    // Badge 文字判断
    const hasTextarea = def.fields.some(f => f.type === 'textarea');
    const badgeText = def.runnable ? 'AI' : (hasTextarea ? 'INPUT' : 'NODE');

    // Header
    const header = document.createElement('div');
    header.className = 'cv-node-header';
    header.innerHTML = `
      <span class="cv-status idle" style="background:${def.color}"></span>
      <span class="cv-node-title">${def.label}</span>
      <span class="cv-node-badge" style="background:${def.color}22;color:${def.color};border:1px solid ${def.color}55">${badgeText}</span>
      <span class="cv-node-close" title="删除">✕</span>
    `;
    el.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'cv-node-body';
    def.fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'cv-field-group';
      const lbl = document.createElement('label');
      lbl.className = 'cv-field-label';
      lbl.textContent = field.label;
      group.appendChild(lbl);

      if (field.type === 'textarea') {
        const ta = document.createElement('textarea');
        ta.className = 'cv-field-textarea';
        ta.placeholder = field.placeholder || '';
        ta.rows = 3;
        group.appendChild(ta);
      } else if (field.type === 'select') {
        const sel = document.createElement('select');
        sel.className = 'cv-field-select';
        (field.options || []).forEach(opt => {
          const o = document.createElement('option');
          o.value = opt; o.textContent = opt;
          sel.appendChild(o);
        });
        group.appendChild(sel);
      }
      body.appendChild(group);
    });
    el.appendChild(body);

    // Footer (runnable)
    if (def.runnable) {
      const footer = document.createElement('div');
      footer.className = 'cv-node-footer';
      const btn = document.createElement('button');
      btn.className = 'cv-node-run';
      btn.innerHTML = '&#9654; 执行';
      btn.style.background = def.color;
      footer.appendChild(btn);
      el.appendChild(footer);

      btn.addEventListener('click', e => {
        e.stopPropagation();
        runNode(id, el);
      });
    }

    // Ports
    if (type !== 'prompt') {
      const portIn = document.createElement('div');
      portIn.className = 'cv-port input';
      portIn.dataset.nodeid = id;
      portIn.dataset.porttype = 'input';
      portIn.style.borderColor = def.color;
      el.appendChild(portIn);
    }
    const portOut = document.createElement('div');
    portOut.className = 'cv-port output';
    portOut.dataset.nodeid = id;
    portOut.dataset.porttype = 'output';
    portOut.style.borderColor = def.color;
    el.appendChild(portOut);

    workspace.appendChild(el);

    const nodeData = { id, type, x: cx, y: cy, el };
    nodes.push(nodeData);

    // 绑定事件
    bindNodeEvents(el, nodeData);

    if (canvasHint) canvasHint.style.display = 'none';
    return nodeData;
  }

  /* ===================== 绑定节点事件 ===================== */
  function bindNodeEvents(el, nodeData) {
    // 节点拖拽（header）
    const header = el.querySelector('.cv-node-header');
    header.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (e.target.classList.contains('cv-node-close')) return;
      e.stopPropagation();
      selectNode(nodeData.id);
      draggingNode = {
        id: nodeData.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startNodeX: nodeData.x,
        startNodeY: nodeData.y,
      };
    });

    // 关闭按钮
    const closeBtn = el.querySelector('.cv-node-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteNode(nodeData.id);
      });
    }

    // 选中
    el.addEventListener('mousedown', e => {
      if (e.button === 0) {
        e.stopPropagation();
        selectNode(nodeData.id);
      }
    });

    // 右键菜单
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      ctxTargetId = nodeData.id;
      showCtxMenu(e.clientX, e.clientY);
    });

    // output port: 开始连线
    const portOut = el.querySelector('.cv-port.output');
    if (portOut) {
      portOut.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const pos = getPortCenter(portOut);
        draggingConn = { fromId: nodeData.id, x1: pos.x, y1: pos.y };
        tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempPath.setAttribute('class', 'cv-conn-temp');
        tempPath.setAttribute('fill', 'none');
        tempPath.setAttribute('stroke', '#818cf8');
        tempPath.setAttribute('stroke-width', '2');
        tempPath.setAttribute('stroke-dasharray', '6,3');
        connSvg.appendChild(tempPath);
      });
    }
  }

  /* ===================== 获取 port 中心（SVG坐标系） ===================== */
  function getPortCenter(portEl) {
    const svgRect  = connSvg.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();
    return {
      x: (portRect.left + portRect.width/2  - svgRect.left),
      y: (portRect.top  + portRect.height/2 - svgRect.top),
    };
  }

  /* ===================== 获取节点port（画布坐标系下屏幕像素） ===================== */
  function getNodePortScreenCenter(nodeId, portType) {
    const nodeData = nodes.find(n => n.id === nodeId);
    if (!nodeData) return null;
    const portEl = nodeData.el.querySelector(`.cv-port.${portType}`);
    if (!portEl) return null;
    return getPortCenter(portEl);
  }

  /* ===================== 选中节点 ===================== */
  function selectNode(id) {
    nodes.forEach(n => n.el.classList.remove('selected'));
    selectedNodeId = id;
    const n = nodes.find(n => n.id === id);
    if (n) n.el.classList.add('selected');
  }

  /* ===================== 删除节点 ===================== */
  function deleteNode(id) {
    // 删除相关连线
    conns = conns.filter(c => {
      if (c.fromId === id || c.toId === id) {
        if (c.pathEl) c.pathEl.remove();
        return false;
      }
      return true;
    });
    // 删除节点 DOM
    const idx = nodes.findIndex(n => n.id === id);
    if (idx !== -1) {
      nodes[idx].el.remove();
      nodes.splice(idx, 1);
    }
    if (selectedNodeId === id) selectedNodeId = null;
    if (nodes.length === 0 && canvasHint) canvasHint.style.display = '';
  }

  /* ===================== 连线渲染 ===================== */
  function buildPath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1},${y1} C ${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
  }

  function renderConns() {
    conns.forEach(c => {
      const p1 = getNodePortScreenCenter(c.fromId, 'output');
      const p2 = getNodePortScreenCenter(c.toId,   'input');
      if (!p1 || !p2) return;
      if (!c.pathEl) {
        c.pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        c.pathEl.setAttribute('class', 'cv-conn');
        c.pathEl.setAttribute('fill', 'none');
        c.pathEl.setAttribute('stroke', '#818cf8');
        c.pathEl.setAttribute('stroke-width', '2');
        connSvg.appendChild(c.pathEl);
      }
      c.pathEl.setAttribute('d', buildPath(p1.x, p1.y, p2.x, p2.y));
    });
  }

  /* ===================== 模拟执行 ===================== */
  function runNode(id, el) {
    const dot = el.querySelector('.cv-status');
    if (!dot) return;
    dot.className = 'cv-status running';
    dot.style.background = '#fbbf24';
    setTimeout(() => {
      dot.className = 'cv-status done';
      dot.style.background = '#22c55e';
    }, 2000);
  }

  /* ===================== 右键菜单 ===================== */
  function showCtxMenu(x, y) {
    if (!ctxMenu) return;
    ctxMenu.style.display = 'block';
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top  = y + 'px';
  }
  function hideCtxMenu() {
    if (ctxMenu) ctxMenu.style.display = 'none';
    ctxTargetId = null;
  }

  /* ===================== 画布事件 ===================== */
  // 滚轮缩放
  canvasArea.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvasArea.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3, Math.max(0.2, zoom * delta));
    panX = mx - (mx - panX) * (newZoom / zoom);
    panY = my - (my - panY) * (newZoom / zoom);
    zoom = newZoom;
    applyTransform();
    renderConns();
  }, { passive: false });

  // 双击创建节点
  canvasArea.addEventListener('dblclick', e => {
    if (e.target !== canvasArea && e.target !== workspace && e.target !== connSvg && e.target !== grid) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    createNode('prompt', pos.x, pos.y);
  });

  // 右键菜单（空白区域）
  canvasArea.addEventListener('contextmenu', e => {
    e.preventDefault();
    hideCtxMenu();
  });

  // mousedown 画布（平移）
  canvasArea.addEventListener('mousedown', e => {
    if (e.button === 1 || (e.button === 0 && (e.target === canvasArea || e.target === workspace || e.target === connSvg || e.target === grid))) {
      if (e.button !== 1 && draggingConn) return;
      draggingCanvas = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = panX;
      dragStartPanY = panY;
      canvasArea.style.cursor = 'grabbing';
      // 取消选中
      if (e.target !== canvasArea && e.target !== workspace) {
        // ok
      } else {
        selectNode(null);
      }
      hideCtxMenu();
    }
  });

  // 全局 mousemove
  document.addEventListener('mousemove', e => {
    // 画布平移
    if (draggingCanvas) {
      panX = dragStartPanX + (e.clientX - dragStartX);
      panY = dragStartPanY + (e.clientY - dragStartY);
      applyTransform();
      renderConns();
    }

    // 节点拖拽
    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startMouseX) / zoom;
      const dy = (e.clientY - draggingNode.startMouseY) / zoom;
      const nodeData = nodes.find(n => n.id === draggingNode.id);
      if (nodeData) {
        nodeData.x = draggingNode.startNodeX + dx;
        nodeData.y = draggingNode.startNodeY + dy;
        nodeData.el.style.left = nodeData.x + 'px';
        nodeData.el.style.top  = nodeData.y + 'px';
        renderConns();
      }
    }

    // 连线拖拽更新临时线
    if (draggingConn && tempPath) {
      const svgRect = connSvg.getBoundingClientRect();
      const mx = e.clientX - svgRect.left;
      const my = e.clientY - svgRect.top;
      tempPath.setAttribute('d', buildPath(draggingConn.x1, draggingConn.y1, mx, my));
    }

    // 卡片拖影
    if (cardDrag && cardDrag.ghost) {
      cardDrag.ghost.style.left = (e.clientX - 40) + 'px';
      cardDrag.ghost.style.top  = (e.clientY - 20) + 'px';
    }
  });

  // 全局 mouseup
  document.addEventListener('mouseup', e => {
    // 画布平移结束
    if (draggingCanvas) {
      draggingCanvas = false;
      canvasArea.style.cursor = '';
    }

    // 节点拖拽结束
    draggingNode = null;

    // 连线结束
    if (draggingConn) {
      // 检查是否落在 input port 上
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target.classList.contains('cv-port') && target.classList.contains('input')) {
        const toId = target.dataset.nodeid;
        if (toId && toId !== draggingConn.fromId) {
          // 避免重复连线
          const exists = conns.some(c => c.fromId === draggingConn.fromId && c.toId === toId);
          if (!exists) {
            conns.push({ fromId: draggingConn.fromId, toId, pathEl: null });
            renderConns();
          }
        }
      }
      if (tempPath) { tempPath.remove(); tempPath = null; }
      draggingConn = null;
    }

    // 卡片拖拽结束
    if (cardDrag) {
      if (cardDrag.ghost) cardDrag.ghost.remove();
      const rect = canvasArea.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom
      ) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        createNode(cardDrag.type, pos.x - 100, pos.y - 60);
      }
      cardDrag = null;
    }
  });

  /* ===================== 空格+拖拽平移 ===================== */
  let spaceDown = false;
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !e.target.matches('input,textarea,select')) {
      spaceDown = true;
      canvasArea.style.cursor = 'grab';
      e.preventDefault();
    }
    if ((e.code === 'Delete' || e.code === 'Backspace') && selectedNodeId && !e.target.matches('input,textarea,select')) {
      deleteNode(selectedNodeId);
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'Space') {
      spaceDown = false;
      canvasArea.style.cursor = '';
    }
  });

  canvasArea.addEventListener('mousedown', e => {
    if (spaceDown && e.button === 0) {
      draggingCanvas = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = panX;
      dragStartPanY = panY;
      canvasArea.style.cursor = 'grabbing';
    }
  });

  /* ===================== 缩放按钮 ===================== */
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoom = Math.min(3, zoom + 0.1);
      applyTransform();
      renderConns();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoom = Math.max(0.2, zoom - 0.1);
      applyTransform();
      renderConns();
    });
  }

  /* ===================== 工具栏按钮 ===================== */
  if (toolbar) {
    toolbar.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'add') {
        const rect = canvasArea.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const pos = screenToCanvas(rect.left + cx, rect.top + cy);
        createNode('prompt', pos.x - 100, pos.y - 80);
      }
    });
  }

  /* ===================== 底部卡片拖拽 ===================== */
  if (bottomBar) {
    bottomBar.addEventListener('mousedown', e => {
      const card = e.target.closest('.cv-card[data-type]');
      if (!card || e.button !== 0) return;
      e.preventDefault();
      const type = card.dataset.type;
      const def  = NODE_DEFS[type];
      if (!def) return;

      // 创建拖影
      const ghost = document.createElement('div');
      ghost.className = 'cv-card-ghost';
      ghost.textContent = def.label;
      ghost.style.cssText = `
        position:fixed;pointer-events:none;z-index:9999;
        background:${def.color}dd;color:#fff;
        padding:6px 14px;border-radius:8px;font-size:13px;
        opacity:0.85;white-space:nowrap;
        left:${e.clientX - 40}px;top:${e.clientY - 20}px;
      `;
      document.body.appendChild(ghost);
      cardDrag = { type, ghost };
    });
  }

  /* ===================== 右键菜单操作 ===================== */
  if (ctxMenu) {
    ctxMenu.addEventListener('click', e => {
      const item = e.target.closest('[data-ctx]');
      if (!item) return;
      const action = item.dataset.ctx;
      if (action === 'delete' && ctxTargetId) {
        deleteNode(ctxTargetId);
      } else if (action === 'copy' && ctxTargetId) {
        const src = nodes.find(n => n.id === ctxTargetId);
        if (src) createNode(src.type, src.x + 30, src.y + 30);
      }
      hideCtxMenu();
    });
  }

  // 点击空白隐藏右键菜单
  document.addEventListener('click', e => {
    if (ctxMenu && !ctxMenu.contains(e.target)) {
      hideCtxMenu();
    }
  });

  /* ===================== 初始化 ===================== */
  applyTransform();
  if (canvasHint) canvasHint.style.display = 'flex';

})();
