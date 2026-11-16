import { Metadata } from 'next'

export const baseMetadata: Metadata = {
  title: {
    default: 'Anni Forever',
    template: '%s | Anni Forever',
  },
  description: 'A celebration of Anni Wilson\'s life, memories, and the people she touched.',
  icons: {
    icon: '/duck_image.png',
  },
}

export function createMetadata(overrides: Partial<Metadata>): Metadata {
  return {
    ...baseMetadata,
    ...overrides,
  }
}

export const pageMetadata = {
  home: createMetadata({
    title: 'Anni Forever',
    description: 'Remembering Anni - A life well lived. Share your memories and celebrate the moments we shared.',
  }),
  messages: createMetadata({
    title: 'Messages',
    description: 'Read and share memories of Anni. Connect with others who knew and loved her.',
  }),
  gallery: createMetadata({
    title: 'Gallery',
    description: 'A photo gallery celebrating Anni\'s life and the memories we made together.',
  }),
  share: createMetadata({
    title: 'Share a Memory',
    description: 'Share your favorite memory or photo of Anni with our community.',
  }),
  admin: createMetadata({
    title: 'Admin Panel',
    description: 'Admin panel for managing the memorial.',
  }),
}
