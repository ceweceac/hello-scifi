require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- 中间件 ---------- */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件 — 同时服务 public/ 和上级项目目录
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..')));

// 全局限流
app.use('/api/', apiLimiter);

/* ---------- 路由 ---------- */
app.use('/api/auth', authRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/* ---------- 全局错��处理 ---------- */
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message
  });
});

/* ---------- 启动 ---------- */
async function start() {
  try {
    // 测试数据库连接
    await testConnection();

    // 同步模型（开发环境用 alter，生产用 migration）
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('[DB] 模型同步完成');

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  AI分镜大师用户系统 已启动`);
      console.log(`  地址: http://localhost:${PORT}`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================================\n`);
    });
  } catch (err) {
    console.error('[启动失败]', err.message);
    process.exit(1);
  }
}

start();
