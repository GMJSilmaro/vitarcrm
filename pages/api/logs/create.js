import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, type = 'info' } = req.body;
    const date = new Date();
    const timestamp = date.toISOString();
    const fileName = `upload_log_${date.toISOString().split('T')[0]}.txt`;
    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, fileName);

    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;

    // Append to log file
    fs.appendFileSync(logPath, logEntry);

    // Also log to server console
    console.log(logEntry);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logging error:', error);
    res.status(500).json({ message: 'Error writing to log file' });
  }
} 