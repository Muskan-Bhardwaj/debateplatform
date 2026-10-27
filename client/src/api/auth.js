import api from './client';

export const authApi = {
  login: (body) => api.post('/auth/login', body).then((res) => res.data),
  register: (body) => api.post('/auth/register', body).then((res) => res.data),
  me: () => api.get('/auth/me').then((res) => res.data.user),
};
