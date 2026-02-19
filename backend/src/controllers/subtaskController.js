const { Subtask } = require('../models');

const getSubtasks = async (req, res) => {
  try {
    const subtasks = await Subtask.findAll({
      where: { task_id: req.params.taskId },
      order: [['created_at', 'ASC']],
    });
    res.json(subtasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener subtareas', error: error.message });
  }
};

const createSubtask = async (req, res) => {
  try {
    const { title, description, priority, estimated_hours } = req.body;
    const subtask = await Subtask.create({
      task_id: req.params.taskId,
      title,
      description,
      priority: priority || 'media',
      estimated_hours: estimated_hours || 0,
    });
    res.status(201).json(subtask);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al crear subtarea', error: error.message });
  }
};

const createBulkSubtasks = async (req, res) => {
  try {
    const { subtasks } = req.body;
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de subtareas' });
    }
    const created = await Subtask.bulkCreate(
      subtasks.map(s => ({
        task_id: req.params.taskId,
        title: s.title,
        description: s.description || '',
        priority: s.priority || 'media',
        estimated_hours: s.estimated_hours || 0,
      }))
    );
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear subtareas', error: error.message });
  }
};

const updateSubtask = async (req, res) => {
  try {
    const subtask = await Subtask.findOne({
      where: { id: req.params.id, task_id: req.params.taskId },
    });
    if (!subtask) return res.status(404).json({ message: 'Subtarea no encontrada' });
    const { title, description, priority, estimated_hours, is_completed } = req.body;
    await subtask.update({ title, description, priority, estimated_hours, is_completed });
    res.json(subtask);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar subtarea', error: error.message });
  }
};

const deleteSubtask = async (req, res) => {
  try {
    const subtask = await Subtask.findOne({
      where: { id: req.params.id, task_id: req.params.taskId },
    });
    if (!subtask) return res.status(404).json({ message: 'Subtarea no encontrada' });
    await subtask.destroy();
    res.json({ message: 'Subtarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar subtarea', error: error.message });
  }
};

module.exports = { getSubtasks, createSubtask, createBulkSubtasks, updateSubtask, deleteSubtask };
