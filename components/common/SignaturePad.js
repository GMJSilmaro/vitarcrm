// SignaturePadReact.js
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from 'react-bootstrap';
import { XCircleFill } from 'react-bootstrap-icons';
import Signature from 'signature_pad';

export default function SignatureField({ width = 500, height = 200, onChange, value }) {
  const canvasRef = useRef(null);
  const sigPadRef = useRef(null);
  const [url, setUrl] = useState('');
  const isUrlLoaded = useRef(false);

  useEffect(() => {
    //* Initialize signature pad on the canvas
    const canvas = canvasRef.current;

    //* Ensure canvas has the correct size
    canvas.width = width;
    canvas.height = height;

    const signaturePad = new Signature(canvas, {
      penColor: 'black',
      backgroundColor: 'rgba(255,255,255,0)', // Transparent bg (or set to white)
    });

    sigPadRef.current = signaturePad;

    //* Add event listeners
    signaturePad.addEventListener('endStroke', handleEndDrawing);

    //* Cleanup on unmount
    return () => {
      signaturePad.off(); //* Remove event listeners
      sigPadRef.current = null;
    };
  }, []);

  const handleEndDrawing = () => {
    if (sigPadRef?.current && !sigPadRef?.current.isEmpty()) {
      const dataUrl = sigPadRef.current.toDataURL('image/png');
      setUrl(dataUrl);
      onChange && onChange(dataUrl);
    }
  };

  const handleClear = useCallback(() => {
    sigPadRef?.current?.clear();
    setUrl('');
    onChange && onChange('');
  }, []);

  useEffect(() => {
    //* Load signature
    if (value && !isUrlLoaded.current && sigPadRef && sigPadRef.current) {
      setUrl(value);
      isUrlLoaded.current = true;
      sigPadRef.current.fromDataURL(value);
    }

    if (value === '') {
      setUrl('');
      isUrlLoaded.current = true;
    }
  }, [value]);

  return (
    <div className='position-relative' style={{ width: 'fit-content' }}>
      <canvas
        className='border rounded'
        ref={canvasRef}
        style={{
          width,
          height,
        }}
        onMouseUp={() => {
          console.log('done');
        }}
      />

      {url && (
        <XCircleFill
          className='text-danger cursor-pointer'
          onClick={handleClear}
          style={{ width: 24, height: 24, position: 'absolute', top: 10, right: 10 }}
        />
      )}
    </div>
  );
}
