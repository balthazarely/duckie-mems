# Photo Wall

A minimal, static photo sharing site. Built with React, Vite, and Supabase.

## Tech Stack

- **Frontend**: Vite, React 18, TypeScript
- **Backend**: Supabase (no server code)
- **Storage**: Supabase Storage (public bucket)
- **Hosting**: Vercel (static site)

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for your project to initialize.
3. Go to **SQL Editor** and create a new query.
4. Copy the contents of `supabase-setup.sql` and paste it into the editor.
5. Run the query.

### 2. Set Up Storage Bucket

1. In your Supabase project, go to **Storage**.
2. Create a new bucket named `photos`.
3. Make sure **Public bucket** is enabled.
4. Click the bucket, then **Policies**.
5. Click **New policy**, then **For authenticated users and anonymous users**.
6. Choose `INSERT (for new objects)`.
7. Paste this SQL:
   ```sql
   (bucket_id = 'photos') 
   and ((storage.foldername(name))[1] = 'public') 
   and (storage.extension(name) in ('jpg', 'jpeg', 'png', 'gif', 'webp')) 
   and ((storage.size(name)) <= 10485760)
   ```
8. Click **Review** and **Save policy**.
9. Create another policy for `SELECT`:
   ```sql
   (bucket_id = 'photos')
   ```

### 3. Get Your Supabase Keys

1. In your Supabase project, go to **Settings** → **API**.
2. Copy the **Project URL** and **Anon public key**.
3. Create a `.env.local` file in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 6. Deploy to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
4. Click **Deploy**.

Your site will be live at your Vercel URL.

## Features

- Photo uploads with optional messages
- Public comments on contributions
- Automatic image compression
- Photo gallery with lightbox
- Mobile-responsive design
- No authentication required

## Customization

Edit the header content in `src/Home.tsx` to customize the page title and messaging.

Adjust colors and spacing in `src/styles.css`.

## Limits

- Photo: 10MB max, image types only (jpg, png, gif, webp)
- Name: 80 characters
- Caption: 500 characters
- Comment: 1000 characters

## License

Free to use and modify.
