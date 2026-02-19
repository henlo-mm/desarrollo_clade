const sequelize = require('../config/database');
const Project = require('./Project');
const Task = require('./Task');
const Subtask = require('./Subtask');

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Task <-> Subtask
Task.hasMany(Subtask, { foreignKey: 'task_id', as: 'subtasks', onDelete: 'CASCADE' });
Subtask.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

module.exports = { sequelize, Project, Task, Subtask };
