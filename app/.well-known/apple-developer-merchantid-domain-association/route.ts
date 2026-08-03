export async function GET() {
  const res = await fetch(
    'https://stripe.com/files/apple-developer-merchantid-domain-association',
    { next: { revalidate: 86400 } }
  )
  const text = await res.text()
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
