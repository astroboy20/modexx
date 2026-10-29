import { getSession } from '@/lib/session'
import LandingClient from '@/components/LandingClient'

export default async function Page() {
  const session = await getSession()
  return <LandingClient user={session} />
}
