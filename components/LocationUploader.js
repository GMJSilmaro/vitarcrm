import React, { useState } from 'react';
import { parseExcelFile } from '../utils/excelParser';
import { Alert, Button, ProgressBar, Card, Badge } from 'react-bootstrap';
import { GeoAlt, Upload } from 'react-bootstrap-icons';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import LocationAnalysisViewer from './LocationAnalysisViewer';

const LocationUploader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState(null);

  const generateSiteId = async () => {
    const locationsRef = collection(db, 'locations');
    const snapshot = await getDocs(
      query(locationsRef, where('siteId', '>=', 'S'), where('siteId', '<=', 'S\uf8ff'))
    );
    
    let maxId = 0;
    snapshot.forEach(doc => {
      const currentId = parseInt(doc.data().siteId.substring(1));
      if (currentId > maxId) maxId = currentId;
    });

    return `S${String(maxId + 1).padStart(6, '0')}`;
  };

  const processLocations = async (data) => {
    const batch = writeBatch(db);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Generate the site ID first
        const siteId = await generateSiteId();
        
        // Create location document with the generated siteId
        const locationRef = doc(collection(db, 'locations'), siteId);
        
        const locationData = {
          siteId,
          customerName: row.Customer_name,
          address: {
            street1: row.Street_1 || '',
            street2: row.Street_2 || '',
            street3: row.Street_3 || '',
            city: row.City || '',
            postal: row.Postcode || '',
            province: row.Province || '',
            country: 'Malaysia'
          }
          // ... rest of your location data
        };

        batch.set(locationRef, locationData);
        // ... rest of your processing logic
      } catch (error) {
        // ... error handling
      }
    }
    // ... rest of the function
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    const startTime = Date.now();

    try {
      const data = await parseExcelFile(file);
      const stats = await processLocations(data);

      setUploadStats({
        totalRecords: data.length,
        successCount: stats.successCount,
        skipCount: stats.skipCount,
        errorCount: stats.errorCount,
        totalTime: ((Date.now() - startTime) / 1000).toFixed(2)
      });

    } catch (error) {
      setError(`Upload error: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <GeoAlt className="me-2" />
            Location Upload
          </h5>
        </Card.Header>
        {/* Rest of the UI similar to CustomerUploader */}
      </Card>
      <LocationAnalysisViewer />
    </div>
  );
};

export default LocationUploader; 
