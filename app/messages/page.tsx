import MessagesClient from './messages-client'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata.messages

export default function MessagesPage() {
  return <MessagesClient />
}
