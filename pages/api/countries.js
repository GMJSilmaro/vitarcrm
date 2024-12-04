import { cache } from 'react';

export const revalidate = 3600; // Revalidate every hour

export default async function handler(req, res) {
  try {
    const response = await fetch('https://www.apicountries.com/countries');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
} 