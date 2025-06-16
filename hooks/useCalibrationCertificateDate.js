import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

export const useCertificateData = (calibrateId, jobId, trigger) => {
  const [calibration, setCalibration] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const shouldFetch = trigger > 0 && !calibration;

  const [calibratedBy, setCalibratedBy] = useState({ data: {}, isLoading: true, isError: false });
  const [approvedSignatory, setApprovedSignatory] = useState({data: {}, isLoading: true, isError: false}); //prettier-ignore

  useEffect(() => {
    const fetchData = async () => {
      if (!calibrateId || !shouldFetch) return;

      setIsLoading(true);

      try {
        const jobHeaderRef = doc(db, 'jobHeaders', jobId);
        const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
        const certificateRef = doc(db, 'jobCertificates', calibrateId);

        const [calibrationSnap, certificateSnap, jobHeaderSnap] = await Promise.all([
          getDoc(calibrationRef),
          getDoc(certificateRef),
          getDoc(jobHeaderRef),
        ]);

        if (calibrationSnap.exists() && certificateSnap.exists() && jobHeaderSnap.exists()) {
          const calibrationData = calibrationSnap.data();
          const certificateData = certificateSnap.data();
          const jobHeaderData = { jobId: jobHeaderSnap.id, ...jobHeaderSnap.data() };

          const locationSnap = jobHeaderData.location?.id
            ? await getDoc(doc(db, 'locations', jobHeaderData.location.id))
            : undefined;

          const equipmentSnap = calibrationData.description?.id
            ? await getDoc(doc(db, 'customerEquipments', calibrationData.description.id))
            : undefined;

          const resolvedData = calibrationData?.data ? JSON.parse(calibrationData.data) : null;

          const calibrationObj = {
            id: calibrationSnap.id,
            ...calibrationData,
            data: resolvedData,
            ...certificateData,
            location: locationSnap?.exists()
              ? { id: locationSnap.id, ...locationSnap.data() }
              : undefined,
            description: equipmentSnap?.exists()
              ? { id: equipmentSnap.id, ...equipmentSnap.data() }
              : undefined,
            job: { id: jobHeaderSnap.id, ...jobHeaderData },
          };

          setCalibration(calibrationObj);

          const instrumentsSnap = await getDocs(collection(db, 'equipments'));
          const filtered = instrumentsSnap.docs
            .filter((doc) => calibrationObj.instruments?.includes(doc.id))
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                tagId: data.tagId,
                description: data.description,
                category: data.category?.toLowerCase() || '',
                make: data.make,
                model: data.model,
                serialNumber: data.serialNumber,
                traceability: data.traceability,
                certificateNo: data.certificateNo,
                dueDate: undefined,
              };
            });

          setInstruments(filtered);
        } else {
          setError('Error fetching calibration or related data');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error fetching calibration data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [trigger, calibrateId, jobId, shouldFetch]);

  //* set calibratedBy and approvedSignatory
  useEffect(() => {
    if (
      calibration?.calibratedBy &&
      calibration?.calibratedBy?.id &&
      calibration?.approvedSignatory &&
      calibration?.approvedSignatory?.id
    ) {
      getDocs(
        query(
          collection(db, 'users'),
          where('workerId', 'in', [
            calibration?.calibratedBy?.id ?? '',
            calibration?.approvedSignatory?.id ?? '',
          ])
        )
      )
        .then((snapshot) => {
          if (!snapshot.empty) {
            const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const calibrateByData = docs.find((doc) => doc.workerId === calibration.calibratedBy.id); //prettier-ignore
            const approvedSignatoryData = docs.find((doc) => doc.workerId === calibration.approvedSignatory.id); //prettier-ignore

            console.log({ calibrateByData, approvedSignatoryData });

            if (calibrateByData) setCalibratedBy({ data: calibrateByData, isLoading: false, isError: false }); //prettier-ignore
            if (approvedSignatoryData)  setApprovedSignatory({ data: approvedSignatoryData,isLoading: false, isError: false,}); //prettier-ignore
          }
        })
        .catch((err) => {
          console.error(err.message);
          setCalibratedBy({ data: {}, isLoading: false, isError: true });
          setApprovedSignatory({ data: {}, isLoading: false, isError: true });
        });
    } else {
      setCalibratedBy({ data: {}, isLoading: false, isError: false });
      setApprovedSignatory({ data: {}, isLoading: false, isError: false });
    }
  }, [calibration]);

  return {
    calibration,
    instruments,
    approvedSignatory,
    calibratedBy,
    isLoading,
    error,
  };
};
