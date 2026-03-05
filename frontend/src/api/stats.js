import client from './client'

export const getSummary     = ()  => client.get('/stats').then(r => r.data)
export const getEquityCurve = ()  => client.get('/stats/equity-curve').then(r => r.data)
export const getMonthlyPnL  = ()  => client.get('/stats/monthly').then(r => r.data)
