import { redirect } from 'next/navigation'

// Permanent redirect: /story/[id] → /rozpravky/[id]
export default async function StoryRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/rozpravky/${id}`)
}
