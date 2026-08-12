import client from './axios';

const unwrap = (res) => res.data.data ?? res.data;


export const authApi = {
  login: (username, password) =>
    client.post('/auth/login', { username, password }).then((r) => r.data),
};

export const categoryApi = {
  list: () => client.get('/categories').then(unwrap),
  get: (id) => client.get(`/categories/${id}`).then(unwrap),
  create: (payload) => client.post('/categories', payload).then(unwrap),
  update: (id, payload) => client.put(`/categories/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/categories/${id}`).then(unwrap),
};

export const productApi = {
  list: () => client.get('/products').then(unwrap),
  get: (id) => client.get(`/products/${id}`).then(unwrap),
  create: (payload) => client.post('/products', payload).then(unwrap),
  update: (id, payload) => client.put(`/products/${id}`, payload).then(unwrap),
  remove: (id) => client.delete('/products', { data: { id } }).then(unwrap),
};


export const staffApi = {
  list: () => client.get('/staff').then(unwrap),
  get: (id) => client.get(`/staff/${id}`).then(unwrap),
  create: (payload) => client.post('/staff', payload).then(unwrap),
  update: (id, payload) => client.put(`/staff/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/staff/${id}`).then(unwrap),
};

export const partyApi = {
  list: () => client.get('/party').then(unwrap),
  get: (id) => client.get(`/party/${id}`).then(unwrap),
  create: (payload) => client.post('/party', payload).then(unwrap),
  update: (id, payload) => client.put(`/party/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/party/${id}`).then(unwrap),
};

export const inventoryApi = {
  list: () => client.get('/inventory').then(unwrap),
  // backend routes GET /inventory/:id to getLogs (not a single inventory record)
  getLogs: (productId) => client.get(`/inventory/${productId}`).then(unwrap),
  adjust: (productId, payload) => client.put(`/inventory/${productId}`, payload).then(unwrap),
};

export const salesApi = {
  list: (params) => client.get('/sales', { params }).then(unwrap),
  get: (id) => client.get(`/sales/${id}`).then(unwrap),
  create: (payload) => client.post('/sales', payload).then(unwrap),
  cancel: (id) => client.delete(`/sales/${id}`).then(unwrap),
};

export const purchaseApi = {
  list: (params) => client.get('/purchase', { params }).then(unwrap),
  get: (id) => client.get(`/purchase/${id}`).then(unwrap),
  create: (payload) => client.post('/purchase', payload).then(unwrap),
};


export const paymentApi = {
  list: (params) => client.get('/payment', { params }).then(unwrap),
  create: (payload) => client.post('/payment', payload).then(unwrap),
};


export const expenseApi = {
  list: (params) => client.get('/expenses', { params }).then(unwrap),
  get: (id) => client.get(`/expenses/${id}`).then(unwrap),
  create: (payload) => client.post('/expenses', payload).then(unwrap),
  update: (id, payload) => client.put(`/expenses/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/expenses/${id}`).then(unwrap),
};

export const ledgerApi = {
  getByParty: (partyId) => client.get(`/ledger/${partyId}`).then(unwrap),
  getBalance: (partyId) => client.get(`/ledger/${partyId}/balance`).then(unwrap),
};

export const usersApi = {
  list: () => client.get('/users').then(unwrap),
  create: (payload) => client.post('/users', payload).then(unwrap),
  update: (id, payload) => client.put(`/users/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/users/${id}`).then(unwrap),
};
