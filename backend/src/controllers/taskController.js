const { Task, Subtask } = require('../models');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { project_id: req.params.projectId },
      include: [{ model: Subtask, as: 'subtasks' }],
      order: [['created_at', 'ASC']],
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, project_id: req.params.projectId },
      include: [{ model: Subtask, as: 'subtasks', order: [['created_at', 'ASC']] }],
    });
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tarea', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, status, estimated_hours } = req.body;
    const task = await Task.create({
      project_id: req.params.projectId,
      title,
      description,
      priority: priority || 'media',
      status: status || 'backlog',
      estimated_hours: estimated_hours || 0,
    });
    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al crear tarea', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, project_id: req.params.projectId },
    });
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    const { title, description, priority, status, estimated_hours } = req.body;
    await task.update({ title, description, priority, status, estimated_hours });
    res.json(task);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al actualizar tarea', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, project_id: req.params.projectId },
    });
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    await task.destroy();
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea', error: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
