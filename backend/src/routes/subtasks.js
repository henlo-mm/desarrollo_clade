const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSubtasks,
  createSubtask,
  createBulkSubtasks,
  updateSubtask,
  deleteSubtask,
} = require('../controllers/subtaskController');

router.get('/', getSubtasks);
router.post('/', createSubtask);
router.post('/bulk', createBulkSubtasks);
router.put('/:id', updateSubtask);
router.delete('/:id', deleteSubtask);

module.exports = router;
