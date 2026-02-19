import client from './client';

export const getTasks = (projectId) => client.get(`/projects/${projectId}/tasks`);
export const getTask = (projectId, taskId) => client.get(`/projects/${projectId}/tasks/${taskId}`);
export const createTask = (projectId, data) => client.post(`/projects/${projectId}/tasks`, data);
export const updateTask = (projectId, taskId, data) => client.put(`/projects/${projectId}/tasks/${taskId}`, data);
export const deleteTask = (projectId, taskId) => client.delete(`/projects/${projectId}/tasks/${taskId}`);
