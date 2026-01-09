import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (email: string, password: string, name: string) =>
  api.post('/auth/register', { email, password, name });

// Todos
export const getTodos = () => api.get('/todos');
export const createTodo = (data: any) => api.post('/todos', data);
export const updateTodo = (id: string, data: any) => api.put(`/todos/${id}`, data);
export const deleteTodo = (id: string) => api.delete(`/todos/${id}`);

// Compliance Submissions
export const getSubmissions = () => api.get('/compliance');
export const getExpiringSubmissions = () => api.get('/compliance/expiring');
export const createSubmission = (data: any) => api.post('/compliance', data);
export const updateSubmission = (id: string, data: any) => api.put(`/compliance/${id}`, data);
export const deleteSubmission = (id: string) => api.delete(`/compliance/${id}`);

// Compliance Account Types
export const getAccountTypes = (state?: string) => 
  api.get('/compliance/account-types', { params: state ? { state } : {} });

// Compliance Scopes
export const getScopes = () => api.get('/compliance/scopes');

// State Resources
export const getResources = (params?: any) => api.get('/resources', { params });
export const getResource = (id: string) => api.get(`/resources/${id}`);
export const createResource = (data: any) => api.post('/resources', data);
export const updateResource = (id: string, data: any) => api.put(`/resources/${id}`, data);
export const deleteResource = (id: string) => api.delete(`/resources/${id}`);

// Nexus Analysis
export const analyzeNexus = (formData: FormData) =>
  api.post('/nexus/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getNexusHistory = () => api.get('/nexus/history');

export default api;
