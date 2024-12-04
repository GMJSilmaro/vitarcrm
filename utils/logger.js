import pino from 'pino'

const logger = pino({
  browser: {
    write: (o) => {
      // Also save to localStorage for persistence
      const timestamp = new Date().toISOString()
      const logKey = `uploadLog_${timestamp}`
      localStorage.setItem(logKey, JSON.stringify(o))
    }
  },
  level: 'info',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
})

export default logger 