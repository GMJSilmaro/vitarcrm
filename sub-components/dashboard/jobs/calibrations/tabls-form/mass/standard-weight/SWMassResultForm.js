import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { Table } from 'react-bootstrap';
import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo } from 'react';
import { safeParseFloat } from '@/utils/common';

const SWMassResultForm = ({ data }) => {
  const form = useFormContext();

  const nominalValues = useWatch({ control: form.control, name: 'nominalValues' }) || []; //prettier-ignore
  const isNominalValueWithAsterisks = useWatch({ control: form.control, name: 'isNominalValueWithAsterisks' }) || []; //prettier-ignore
  const resultExpandedUncertainties = useWatch({ control: form.control, name: 'resultExpandedUncertainties' }) || []; //prettier-ignore
  const conventionalValues = useWatch({ control: form.control, name: 'conventionalValues' }) || []; //prettier-ignore
  const mpes = useWatch({ control: form.control, name: 'mpes' }) || []; //prettier-ignore

  const accuracyClass = useMemo(() => {
    const value = form.getValues('accuracyClass');
    return value && typeof value === 'object' ? value?.value : value;
  }, [JSON.stringify(form.watch('accuracyClass'))]);

  const testWeightNo = useMemo(() => {
    return safeParseFloat(form.getValues('testWeightNo'));
  }, [JSON.stringify(form.watch('testWeightNo'))]);

  return (
    <div className='d-flex flex-column row-gap-3'>
      <div className='flex align-items-center gap-2'>
        <div className='d-flex align-items-center gap-4'>
          <div className='fs-5'>
            <span className='pe-2'>Accuracy Class:</span>
            <span className='fw-bold text-capitalize'>{accuracyClass}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>No. of Test Weight:</span>
            <span className='fw-bold'>{testWeightNo || ''}</span>
          </div>
        </div>
      </div>

      <div>
        {testWeightNo && (testWeightNo > 0 || testWeightNo <= 30) ? (
          <Table className='text-center align-middle'>
            <thead>
              <tr>
                <th>Point</th>
                <th>Nominal Value (g)</th>
                <th>Conventional Value (g)</th>
                <th>MPE (g)</th>
                <th>Expanded Uncertainty (g)</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: testWeightNo }).map((_, i) => (
                <tr key={i}>
                  <td>A{i + 1}</td>
                  <td>
                    {formatToDicimalString(nominalValues?.[i], 3)}
                    {isNominalValueWithAsterisks?.[i] ? '*' : ''}
                  </td>
                  <td>
                    {formatToDicimalString(nominalValues?.[i], 3)} &nbsp;&nbsp;&nbsp;
                    {formatToDicimalString(conventionalValues?.[i], 6)}
                  </td>
                  <td>{accuracyClass === 'N/A' ? 'N/A' : formatToDicimalString(mpes?.[i], 6)}</td>
                  <td>
                    <span className='me-2'>±</span>{' '}
                    {formatToDicimalString(resultExpandedUncertainties?.[i], 6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className='text-center'>
            <h4 className='mb-0'>No. of Test Weight not yet supported</h4>
            <p>Module is under development</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SWMassResultForm;
