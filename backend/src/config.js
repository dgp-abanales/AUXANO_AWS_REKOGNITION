const PLACEHOLDER_KEYS = new Set([
  'your_access_key',
  'your_secret_key',
  '',
  undefined,
]);

export function isAwsConfigured() {
  const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  return !PLACEHOLDER_KEYS.has(accessKey) && !PLACEHOLDER_KEYS.has(secretKey);
}

export function isDevModeForced() {
  return process.env.DEV_MODE === 'true';
}
