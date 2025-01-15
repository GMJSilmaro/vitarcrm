export default async function handler(req, res) {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3');
    const data = await response.json();
    
    // Transform the data into the required format
    const countries = data.map(country => ({
      country: country.cca2 || country.cca3, // Use cca2 (ISO2) with fallback to cca3 (ISO3)
      name: country.name.common
    }))
    .filter(country => country.country && country.name) // Filter out any invalid entries
    .sort((a, b) => a.name.localeCompare(b.name));
    
    res.status(200).json(countries);
  } catch (error) {
    console.error('API Error:', error);
    // Return a fallback list of major countries if the API fails
    const fallbackCountries = [
      { country: 'US', name: 'United States' },
      { country: 'GB', name: 'United Kingdom' },
      { country: 'CA', name: 'Canada' },
      { country: 'AU', name: 'Australia' },
      { country: 'NZ', name: 'New Zealand' },
      { country: 'DE', name: 'Germany' },
      { country: 'FR', name: 'France' },
      { country: 'IT', name: 'Italy' },
      { country: 'ES', name: 'Spain' },
      { country: 'JP', name: 'Japan' }
    ];
    res.status(200).json(fallbackCountries);
  }
}