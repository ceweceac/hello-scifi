const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: { msg: '用户名已被注册' },
    validate: {
      len: { args: [2, 30], msg: '用户名长度 2-30 个字符' }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: { msg: '邮箱已被注册' },
    validate: {
      isEmail: { msg: '邮箱格式不正确' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  status: {
    type: DataTypes.ENUM('active', 'disabled'),
    defaultValue: 'active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'users',
  hooks: {
    // 创建 / 更新时自动加密密码
    beforeCreate: async (user) => {
      if (user.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    }
  }
});

// 实例方法：校验密码
User.prototype.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// 实例方法：返回安全的用户对象（不含密码等敏感字段）
User.prototype.toSafeJSON = function () {
  const { id, username, email, avatar, role, status, lastLoginAt, createdAt, updatedAt } = this.toJSON();
  return { id, username, email, avatar, role, status, lastLoginAt, createdAt, updatedAt };
};

module.exports = User;
