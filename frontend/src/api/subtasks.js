import client from './client';

export const getSubtasks = (projectId, taskId) =>
  client.get(`/projects/${projectId}/tasks/${taskId}/subtasks`);

export const createSubtask = (projectId, taskId, data) =>
  client.post(`/projects/${projectId}/tasks/${taskId}/subtasks`, data);

export const createBulkSubtasks = (projectId, taskId, subtasks) =>
  client.post(`/projects/${projectId}/tasks/${taskId}/subtasks/bulk`, { subtasks });

export const updateSubtask = (projectId, taskId, subtaskId, data) =>
  client.put(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, data);

export const deleteSubtask = (projectId, taskId, subtaskId) =>
  client.delete(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`);
