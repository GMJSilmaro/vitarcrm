import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get logs from localStorage instead of file system
    const logs = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('uploadLogs')) {
        logs.push(localStorage.getItem(key));
      }
    }

    // Sort logs by timestamp (assuming they're stored with timestamps)
    const sortedLogs = logs.sort().reverse();

    res.status(200).json({ logs: sortedLogs });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ message: 'Error reading logs' });
  }
} 