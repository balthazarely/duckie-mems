import AdminClient from './admin-client'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata.admin

export default function AdminPage() {
  return <AdminClient />
}
