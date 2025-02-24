const FormDebug = ({ form }) => {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className='d-flex gap-3 mt-4'>
      <div className='w-50'>
        <h6 className='mb-3'>Form Data</h6>
        <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
      </div>

      <div className='w-50'>
        <h6 className='mb-3'>Form Errors</h6>
        <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FormDebug;
