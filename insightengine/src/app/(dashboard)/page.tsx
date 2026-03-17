import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome, user {userId}</p>
    </main>
  )
}
