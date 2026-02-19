const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El título no puede estar vacío' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('alta', 'media', 'baja'),
    defaultValue: 'media',
  },
  status: {
    type: DataTypes.ENUM('backlog', 'en_progreso', 'testing', 'terminada'),
    defaultValue: 'backlog',
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
}, {
  tableName: 'tasks',
  underscored: true,
});

module.exports = Task;
