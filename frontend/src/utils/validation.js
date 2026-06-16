export const POSES = [
  { id: 'front', label: 'Front View', hint: 'Look straight at the camera' },
  { id: 'left', label: 'Left Profile', hint: 'Turn your head to the left' },
  { id: 'right', label: 'Right Profile', hint: 'Turn your head to the right' },
];

export function validateFormFields({ fullName, employeeId, email }) {
  const errors = {};

  if (!fullName?.trim()) {
    errors.fullName = 'Full name is required';
  } else if (fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters';
  }

  if (!employeeId?.trim()) {
    errors.employeeId = 'Employee ID is required';
  } else if (!/^[A-Za-z0-9-]+$/.test(employeeId.trim())) {
    errors.employeeId = 'Employee ID can only contain letters, numbers, and hyphens';
  }

  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  return errors;
}

export function allImagesCaptured(captures) {
  return POSES.every((p) => captures[p.id]?.blob && captures[p.id]?.valid);
}
