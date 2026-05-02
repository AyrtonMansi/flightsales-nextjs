export async function POST(request) {
  try {
    const { password } = await request.json();
    
    // Check if password protection is enabled
    if (process.env.SITE_PASSWORD_PROTECTED !== 'true') {
      return Response.json({ ok: true });
    }
    
    // Verify password
    if (password === process.env.SITE_PASSWORD) {
      return Response.json({ ok: true });
    }
    
    return Response.json({ ok: false, error: 'incorrect_password' }, { status: 401 });
  } catch (err) {
    return Response.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }
}
