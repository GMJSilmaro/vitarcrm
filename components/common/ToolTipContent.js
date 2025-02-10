export const TooltipContent = ({ title, info, children }) => {
  return (
    <div className='text-start'>
      <strong>{title}: </strong>

      {children ? (
        <>{children}</>
      ) : (
        <ul className='ps-3 mb-2'>
          {info.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
