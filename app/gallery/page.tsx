import { pageMetadata } from '@/lib/metadata'
import GalleryClient from './gallery-client'

export const metadata = pageMetadata.gallery

export default function Gallery() {
  return <GalleryClient />
}
