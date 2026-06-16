import { useState } from 'react';
import WebcamCapture from './WebcamCapture';
import { POSES, validateFormFields, allImagesCaptured } from '../utils/validation';
import { validateImage, enrollUser } from '../utils/api';

const emptyCaptures = () =>
  Object.fromEntries(POSES.map((p) => [p.id, { blob: null, preview: null, valid: false, errors: [] }]));

export default function EnrollForm() {
  const [form, setForm] = useState({ fullName: '', employeeId: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [captures, setCaptures] = useState(emptyCaptures);
  const [activePose, setActivePose] = useState('front');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCapture = async (blob, pose) => {
    setValidating(true);
    setError(null);
    setMessage(null);

    const preview = URL.createObjectURL(blob);

    try {
      const result = await validateImage(blob, pose);

      setCaptures((prev) => ({
        ...prev,
        [pose]: {
          blob,
          preview,
          valid: result.valid,
          errors: result.errors || [],
          metrics: result.metrics,
        },
      }));

      if (result.valid) {
        const nextPose = POSES.find((p) => !captures[p.id]?.valid && p.id !== pose);
        if (nextPose) setActivePose(nextPose.id);
      }
    } catch (err) {
      setCaptures((prev) => ({
        ...prev,
        [pose]: { blob, preview, valid: false, errors: [err.message] },
      }));
    } finally {
      setValidating(false);
    }
  };

  const handleReset = () => {
    setCaptures(emptyCaptures());
    setActivePose('front');
    setMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    const errors = validateFormFields(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!allImagesCaptured(captures)) {
      setError('Please capture and validate all 3 face images before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const result = await enrollUser({
        fullName: form.fullName,
        employeeId: form.employeeId,
        email: form.email,
        images: POSES.map((p) => captures[p.id].blob),
        poses: POSES.map((p) => p.id),
      });

      const user = result.user || {};
      setMessage(
        `Successfully enrolled ${user.fullName || form.fullName} (ID: ${user.employeeId || form.employeeId})`
      );
      setForm({ fullName: '', employeeId: '', email: '' });
      handleReset();
    } catch (err) {
      setError(err.message || 'Enrollment failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Enroll New Face</h2>
      <p className="card-subtitle">
        Enter employee details and capture 3 face images (front, left, right) for AWS Rekognition enrollment.
      </p>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className={fieldErrors.fullName ? 'error' : ''}
            placeholder="Juan Dela Cruz"
          />
          {fieldErrors.fullName && <p className="field-error">{fieldErrors.fullName}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="employeeId">Employee ID</label>
          <input
            id="employeeId"
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            className={fieldErrors.employeeId ? 'error' : ''}
            placeholder="EMP-001"
          />
          {fieldErrors.employeeId && <p className="field-error">{fieldErrors.employeeId}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={fieldErrors.email ? 'error' : ''}
            placeholder="juan@company.com"
          />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="pose-selector">
        {POSES.map((pose) => (
          <button
            key={pose.id}
            className={`pose-btn ${activePose === pose.id ? 'active' : ''} ${captures[pose.id]?.valid ? 'done' : ''}`}
            onClick={() => setActivePose(pose.id)}
          >
            {pose.label} {captures[pose.id]?.valid ? '✓' : ''}
          </button>
        ))}
      </div>

      <p className="card-subtitle" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {POSES.find((p) => p.id === activePose)?.hint}
      </p>

      <WebcamCapture
        onCapture={handleCapture}
        activePose={activePose}
        disabled={validating || saving}
      />

      {validating && (
        <div className="alert alert-info">Validating face with AWS Rekognition...</div>
      )}

      <div className="capture-grid">
        {POSES.map((pose) => {
          const cap = captures[pose.id];
          return (
            <div
              key={pose.id}
              className={`capture-slot ${cap?.valid ? 'captured' : ''} ${cap?.blob && !cap?.valid ? 'invalid' : ''}`}
            >
              <div className="capture-slot-label">{pose.label}</div>
              <div className="capture-preview">
                {cap?.preview ? (
                  <img src={cap.preview} alt={pose.label} />
                ) : (
                  <span className="capture-placeholder">No image</span>
                )}
              </div>
              {cap?.valid && <div className="capture-status valid">Validated</div>}
              {cap?.errors?.length > 0 && (
                <div className="capture-status invalid">
                  {cap.errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="actions-row">
        <button className="btn btn-outline" onClick={handleReset} disabled={saving}>
          Reset Images
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving || validating || !allImagesCaptured(captures)}
        >
          {saving ? (
            <>
              <span className="spinner" /> Saving...
            </>
          ) : (
            'Save Enrollment'
          )}
        </button>
      </div>
    </div>
  );
}
