import { redirect } from 'next/navigation'

// Root page — redirect to login
// Auth middleware will handle protected routes
export default function Home() {
  redirect('/login')
}
