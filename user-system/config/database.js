const { Sequelize } = require('sequelize');
const path = require('path');

// 根据环境选择数据库：支持 MySQL 和 SQLite
// DB_DIALECT=sqlite 时使用本地文件数据库（零配置）
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'sqlite') {
  const dbPath = process.env.DB_STORAGE || path.join(__dirname, '..', 'data', 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ai_storyboard',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      timezone: '+08:00',
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true,
        underscored: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`[DB] ${dialect.toUpperCase()} 连接成功`);
  } catch (err) {
    console.error('[DB] 连接失败:', err.message);
    throw err;
  }
}

module.exports = { sequelize, testConnection };
