import { redirect } from 'next/navigation'

// Root → always go to public apps list
export default function RootPage() {
  redirect('/apps')
}
