import { useRef, useEffect, useState, useCallback } from 'react';

export default function WebcamCapture({ onCapture, activePose, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
        setError(null);
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
      setReady(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob, activePose);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="webcam-section">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="webcam-container">
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="webcam-overlay">
          <div className="face-guide" />
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="webcam-controls">
        <button
          className="btn btn-secondary"
          onClick={capture}
          disabled={!ready || disabled}
        >
          Capture {activePose} View
        </button>
        <button className="btn btn-outline" onClick={startCamera} disabled={disabled}>
          Restart Camera
        </button>
      </div>
    </div>
  );
}
