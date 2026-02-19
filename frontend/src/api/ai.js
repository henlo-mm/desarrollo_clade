import client from './client';

export const decomposeTask = (description, context) =>
  client.post('/ai/decompose', { description, context });
