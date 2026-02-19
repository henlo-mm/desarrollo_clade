const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const subtaskRoutes = require('./subtasks');

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.use('/:taskId/subtasks', subtaskRoutes);

module.exports = router;
