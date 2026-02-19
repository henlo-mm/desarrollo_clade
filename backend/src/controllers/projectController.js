const { Project, Task } = require('../models');

const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{ model: Task, as: 'tasks', attributes: ['id', 'status'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proyectos', error: error.message });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: Task, as: 'tasks', order: [['created_at', 'ASC']] }],
    });
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proyecto', error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, deadline } = req.body;
    const project = await Project.create({ name, description, deadline });
    res.status(201).json(project);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
    const { name, description, deadline, status } = req.body;
    await project.update({ name, description, deadline, status });
    res.json(project);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al actualizar proyecto', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
    await project.destroy();
    res.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
