import api from './client';

export const debatesApi = {
  list: () => api.get('/debates').then((res) => res.data.debates),
  get: (id) => api.get(`/debates/${id}`).then((res) => res.data.debate),
  create: (body) => api.post('/debates', body).then((res) => res.data.debate),
  update: (id, body) => api.put(`/debates/${id}`, body).then((res) => res.data.debate),
  remove: (id) => api.delete(`/debates/${id}`),
  complete: (id) => api.patch(`/debates/${id}/complete`).then((res) => res.data.debate),
  results: (id) => api.get(`/debates/${id}/results`).then((res) => res.data.results),
};

export const scoresApi = {
  mine: (debateId) => api.get(`/debates/${debateId}/scores/mine`).then((res) => res.data.scores),
  save: (debateId, participantId, body) =>
    api.put(`/debates/${debateId}/scores/${participantId}`, body).then((res) => res.data.score),
};
