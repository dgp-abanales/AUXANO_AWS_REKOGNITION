const API_BASE = '/api';

async function handleResponse(res) {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.errors?.[0] || data.message || 'Request failed');
  }

  if (data.success === false) {
    throw new Error(data.errors?.[0] || data.message || 'Request failed');
  }

  return data;
}

export async function validateImage(imageBlob, pose) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'capture.jpg');
  formData.append('pose', pose);

  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function enrollUser({ fullName, employeeId, email, images, poses }) {
  const formData = new FormData();
  formData.append('fullName', fullName);
  formData.append('employeeId', employeeId);
  formData.append('email', email);
  formData.append('poses', JSON.stringify(poses));

  images.forEach((img, i) => {
    formData.append('images', img, `${poses[i]}.jpg`);
  });

  const res = await fetch(`${API_BASE}/enroll`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function verifyFace(imageBlob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'verify.jpg');

  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  return handleResponse(res);
}
