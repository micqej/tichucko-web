export async function POST() {
  const res = Response.json({ ok: true })
  const headers = new Headers(res.headers)
  headers.set('Set-Cookie', 'admin_token=; Path=/; HttpOnly; Max-Age=0')
  headers.set('Location', '/admin/login')
  return new Response(null, { status: 302, headers })
}
