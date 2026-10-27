import api from './client';

export const motionsApi = {
  list: () => api.get('/motions').then((res) => res.data.motions),
  create: (body) => api.post('/motions', body).then((res) => res.data.motion),
  update: (id, body) => api.put(`/motions/${id}`, body).then((res) => res.data.motion),
  remove: (id) => api.delete(`/motions/${id}`),
};
