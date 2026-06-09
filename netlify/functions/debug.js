export const handler = async () => {
  const url = process.env.SUPABASE_URL || 'NOT SET';
  const key = process.env.SUPABASE_SERVICE_KEY || 'NOT SET';
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      key_length: key.length,
      key_start: key.substring(0, 20),
      key_end: key.substring(key.length - 10),
      jwt_secret_set: !!process.env.JWT_SECRET,
    })
  };
};
