import client from './client'

export const getTrades   = (params = {}) => client.get('/trades',       { params }).then(r => r.data)
export const getTrade    = (id)          => client.get(`/trades/${id}`).then(r => r.data)
export const createTrade = (data)        => client.post('/trades', data).then(r => r.data)
export const updateTrade = (id, data)    => client.patch(`/trades/${id}`, data).then(r => r.data)
export const deleteTrade = (id)          => client.delete(`/trades/${id}`).then(r => r.data)
