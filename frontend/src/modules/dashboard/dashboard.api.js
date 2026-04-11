import api from '../../api/axios';

export const getDashboard = () => api.get('/dashboard');