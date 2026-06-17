import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://trading-copilot-production-d56d.up.railway.app'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
})

export const signalApi = {
  generateSignal: (symbol: string, timeframe: string, save = false) =>
    api.get('/api/v1/signals/generate', { params: { symbol, timeframe, save } }),
  getHistory: (symbol?: string, limit = 20) =>
    api.get('/api/v1/signals/history', { params: { symbol, limit } }),
}

export const marketApi = {
  getCandles: (symbol: string, timeframe: string, limit = 200) =>
    api.get('/api/v1/market/candles', { params: { symbol, timeframe, limit } }),
  getQuote: (symbol: string) =>
    api.get('/api/v1/market/quote/' + symbol),
}

export default api
