/* ======== AUTH UTILITY ======== */
/* 统一管理 Token 存取、API 请求、自动刷新 */

const Auth = (function () {
  'use strict';

  // API 基础地址 — 与后端同源时用相对路径，跨域时改为完整 URL
  const API_BASE = window.AUTH_API_BASE || 'http://localhost:3000/api';

  const KEYS = {
    access:  'hello_access_token',
    refresh: 'hello_refresh_token',
    user:    'hello_user'
  };

  /* ---------- Token 存取 ---------- */
  function saveTokens(accessToken, refreshToken) {
    localStorage.setItem(KEYS.access, accessToken);
    localStorage.setItem(KEYS.refresh, refreshToken);
  }

  function getAccessToken() {
    return localStorage.getItem(KEYS.access);
  }

  function getRefreshToken() {
    return localStorage.getItem(KEYS.refresh);
  }

  function saveUser(user) {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.user) || 'null');
    } catch { return null; }
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  function isLoggedIn() {
    return !!getAccessToken();
  }

  /* ---------- 通用 fetch 封装 ---------- */
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    // 自动附加 Authorization
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    // Token 过期 → 尝试自动刷新
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshed = await tryRefresh();
      if (refreshed) {
        // 用新 token 重试原请求
        headers['Authorization'] = `Bearer ${getAccessToken()}`;
        const retry = await fetch(url, { ...options, headers });
        return retry.json();
      }
      // 刷新失败 → 跳转登录
      clearAll();
      window.location.href = 'login.html';
      return data;
    }

    return data;
  }

  /* ---------- 刷新 Token ---------- */
  async function tryRefresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (data.success && data.data) {
        saveTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /* ---------- 登录 ---------- */
  async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success && data.data) {
      saveTokens(data.data.accessToken, data.data.refreshToken);
      saveUser(data.data.user);
    }
    return data;
  }

  /* ---------- 注册 ---------- */
  async function register(username, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (data.success && data.data) {
      saveTokens(data.data.accessToken, data.data.refreshToken);
      saveUser(data.data.user);
    }
    return data;
  }

  /* ---------- 获取当前用户 ---------- */
  async function getMe() {
    return request('/auth/me');
  }

  /* ---------- 修改资料 ---------- */
  async function updateProfile(payload) {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  /* ---------- 修改密码 ---------- */
  async function changePassword(oldPassword, newPassword) {
    const data = await request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword })
    });
    if (data.success && data.data) {
      saveTokens(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }

  /* ---------- 登出 ---------- */
  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch { /* 忽略网络错误 */ }
    clearAll();
  }

  /* ---------- 鉴权守卫（在需要登录的页面调用） ---------- */
  async function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return null;
    }
    // 验证 token 有效性
    const data = await getMe();
    if (!data.success) {
      clearAll();
      window.location.href = 'login.html';
      return null;
    }
    saveUser(data.data.user);
    return data.data.user;
  }

  return {
    login, register, logout,
    getMe, updateProfile, changePassword,
    getAccessToken, getRefreshToken, getUser,
    saveUser, clearAll, isLoggedIn,
    requireAuth, request
  };
})();
