import api from './client';

export const profileApi = {
  get: () => api.get('/profile').then((res) => res.data),
};
