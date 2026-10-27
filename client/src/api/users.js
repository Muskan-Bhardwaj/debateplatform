import api from './client';

export const usersApi = {
  list: (role) => api.get('/users', { params: role ? { role } : {} }).then((res) => res.data.users),
};
