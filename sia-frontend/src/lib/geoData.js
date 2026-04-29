/**
 * Indonesian Provinces and Capitals Coordinates
 * Used for alumni distribution mapping.
 */

export const geoData = {
  provinces: [
    { name: "Aceh", lat: 4.4144, lng: 96.4851, capital: "Banda Aceh" },
    { name: "Sumatera Utara", lat: 2.1121, lng: 99.3923, capital: "Medan" },
    { name: "Sumatera Barat", lat: -0.7399, lng: 100.8000, capital: "Padang" },
    { name: "Riau", lat: 0.2933, lng: 101.7068, capital: "Pekanbaru" },
    { name: "Jambi", lat: -1.4851, lng: 102.4381, capital: "Jambi" },
    { name: "Sumatera Selatan", lat: -3.3194, lng: 103.9144, capital: "Palembang" },
    { name: "Bengkulu", lat: -3.5778, lng: 102.3464, capital: "Bengkulu" },
    { name: "Lampung", lat: -4.5586, lng: 105.4068, capital: "Bandar Lampung" },
    { name: "Kepulauan Bangka Belitung", lat: -2.7145, lng: 106.5924, capital: "Pangkal Pinang" },
    { name: "Kepulauan Riau", lat: 3.9456, lng: 108.1428, capital: "Tanjung Pinang" },
    { name: "DKI Jakarta", lat: -6.1751, lng: 106.8272, capital: "Jakarta" },
    { name: "Jawa Barat", lat: -7.0909, lng: 107.6689, capital: "Bandung" },
    { name: "Jawa Tengah", lat: -7.1510, lng: 110.1403, capital: "Semarang" },
    { name: "DI Yogyakarta", lat: -7.8754, lng: 110.4262, capital: "Yogyakarta" },
    { name: "Jawa Timur", lat: -7.5361, lng: 112.2384, capital: "Surabaya" },
    { name: "Banten", lat: -6.4444, lng: 106.0606, capital: "Serang" },
    { name: "Bali", lat: -8.4095, lng: 115.1889, capital: "Denpasar" },
    { name: "Nusa Tenggara Barat", lat: -8.6529, lng: 117.3616, capital: "Mataram" },
    { name: "Nusa Tenggara Timur", lat: -8.6574, lng: 121.0794, capital: "Kupang" },
    { name: "Kalimantan Barat", lat: -0.2789, lng: 111.4753, capital: "Pontianak" },
    { name: "Kalimantan Tengah", lat: -1.6815, lng: 113.3824, capital: "Palangka Raya" },
    { name: "Kalimantan Selatan", lat: -3.0926, lng: 115.2838, capital: "Banjarmasin" },
    { name: "Kalimantan Timur", lat: 0.4538, lng: 116.2420, capital: "Samarinda" },
    { name: "Kalimantan Utara", lat: 3.0763, lng: 116.0354, capital: "Tanjung Selor" },
    { name: "Sulawesi Utara", lat: 0.6247, lng: 123.9750, capital: "Manado" },
    { name: "Sulawesi Tengah", lat: -1.4300, lng: 121.4456, capital: "Palu" },
    { name: "Sulawesi Selatan", lat: -3.6688, lng: 119.9741, capital: "Makassar" },
    { name: "Sulawesi Tenggara", lat: -4.1449, lng: 122.1746, capital: "Kendari" },
    { name: "Gorontalo", lat: 0.6999, lng: 122.4467, capital: "Gorontalo" },
    { name: "Sulawesi Barat", lat: -2.8441, lng: 119.2321, capital: "Mamuju" },
    { name: "Maluku", lat: -3.2385, lng: 130.1453, capital: "Ambon" },
    { name: "Maluku Utara", lat: 1.5700, lng: 127.8088, capital: "Sofifi" },
    { name: "Papua", lat: -4.2699, lng: 138.0804, capital: "Jayapura" },
    { name: "Papua Barat", lat: -1.3361, lng: 132.5700, capital: "Manokwari" }
  ]
};

/**
 * Get coordinates for a given province and city.
 * Adds a small "jitter" (random offset) to prevent markers in the same city from perfectly overlapping.
 */
export const getCoordinates = (provinsi, kota) => {
  // Default to Java center if not found
  let baseCoords = { lat: -2.5489, lng: 118.0149 }; 

  const searchStr = `${provinsi || ''} ${kota || ''}`.toLowerCase();

  const provData = geoData.provinces.find(p => {
    const provName = p.name.toLowerCase();
    const capitalName = p.capital.toLowerCase();
    
    // Exact or partial matches for province or capital
    return searchStr.includes(provName) || 
           searchStr.includes(capitalName) ||
           provName.includes(searchStr.replace(/\s+/g, '')) ||
           (provinsi && provName.includes(provinsi.toLowerCase()));
  });

  if (provData) {
    baseCoords = { lat: provData.lat, lng: provData.lng };
  }

  // Jitter logic: Add a small random offset within ~5-10km
  const jitter = () => (Math.random() - 0.5) * 0.15; 
  
  return {
    lat: baseCoords.lat + jitter(),
    lng: baseCoords.lng + jitter()
  };
};
