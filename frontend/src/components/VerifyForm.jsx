import { useState } from 'react';
import WebcamCapture from './WebcamCapture';
import { verifyFace } from '../utils/api';

export default function VerifyForm() {
  const [preview, setPreview] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCapture = async (blob) => {
    setPreview(URL.createObjectURL(blob));
    setVerifying(true);
    setResult(null);
    setError(null);

    try {
      const data = await verifyFace(blob);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Verify Identity</h2>
      <p className="card-subtitle">
        Capture a live photo to match against enrolled faces using AWS Rekognition.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className={`alert ${result.matched ? 'alert-success' : 'alert-error'}`}>
          {result.matched ? (
            <>
              <strong>Match found!</strong> {result.user?.fullName} ({result.user?.employeeId})
              <br />
              Similarity: {result.similarity}%
            </>
          ) : (
            result.message || 'No matching face found in the system.'
          )}
        </div>
      )}

      {verifying && (
        <div className="alert alert-info">Searching for matching face...</div>
      )}

      <WebcamCapture
        onCapture={handleCapture}
        activePose="front"
        disabled={verifying}
      />

      {preview && (
        <div style={{ maxWidth: 320, margin: '0 auto' }}>
          <div className="capture-preview">
            <img src={preview} alt="Verification capture" />
          </div>
        </div>
      )}
    </div>
  );
}
