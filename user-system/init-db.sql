-- AI分镜大师用户系统 — 数据库初始化
-- 在 MySQL 中运行此脚本：mysql -u root -p < init-db.sql

CREATE DATABASE IF NOT EXISTS ai_storyboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_storyboard;

-- 用户表（Sequelize 会自动同步，此处仅作备份参考）
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  status ENUM('active', 'disabled') DEFAULT 'active',
  last_login_at DATETIME DEFAULT NULL,
  refresh_token VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '数据库 ai_storyboard 初始化完成！' AS message;
