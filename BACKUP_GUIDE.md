# Backup Guide

This guide explains how to backup your Supabase database and storage.

## Setup

### 1. Get your Supabase Secret API Key

⚠️ **Keep this key secret! It has full database access.**

1. Go to Supabase Dashboard → Settings → API
2. Under "Secret API Keys", copy your secret key
3. If you don't see one, create a new one

### 2. Add to your `.env.local` file

```
SUPABASE_SECRET_API_KEY=your_secret_api_key_here
```

(The `NEXT_PUBLIC_SUPABASE_URL` should already be in your .env.local)

### 3. Install dependencies (one-time)

```bash
npm install
```

The script uses `@supabase/supabase-js` which is already in your project.

## Running Backups

### Manual Backup (one-time)

```bash
node backup.js
```

This creates a backup in `backups/YYYY-MM-DD/` with:
- `posts.json` - all posts
- `comments.json` - all comments
- `photos/` - all photo files
- `backup-summary.json` - what was backed up

### Automated Weekly Backup (Recommended)

**On macOS/Linux:**

Add to crontab (runs every Sunday at 2 AM):
```bash
crontab -e
# Add this line:
0 2 * * 0 cd /path/to/annie-memorial && node backup.js
```

**On Windows:**
Use Task Scheduler to run:
```batch
cd C:\path\to\annie-memorial && node backup.js
```

### Schedule with npm script

Add to `package.json`:
```json
{
  "scripts": {
    "backup": "node backup.js"
  }
}
```

Then run:
```bash
npm run backup
```

## Backup Structure

```
backups/
├── 2026-11-17/
│   ├── posts.json (all posts data)
│   ├── comments.json (all comments data)
│   ├── photos/ (actual image files)
│   └── backup-summary.json (count summary)
├── 2026-11-10/
│   └── ...
```

## Restore from Backup

If you need to restore:

1. **Tables** - Import the JSON files into Supabase:
   - Dashboard → SQL Editor → Copy/paste insert statements from JSON
   
2. **Storage** - Re-upload photos from the `photos/` folder:
   - Dashboard → Storage → photos bucket → Upload files

## Best Practices

✅ **Do:**
- Run backup weekly or bi-weekly
- Store backups in multiple locations (cloud, external drive)
- Keep `.env.local` with the service role key safe
- Test restore process occasionally

❌ **Don't:**
- Share the service role key
- Commit `.env.local` to git
- Store backups only on one device

## Backup Locations (Recommended)

Pick at least 2:
- Local `backups/` folder (use git-ignore)
- Google Drive / Dropbox (auto-sync the folder)
- AWS S3 or similar cloud storage
- External USB drive (monthly)

## Questions?

If backups fail:
1. Check `.env.local` has correct keys
2. Run with debugging: `DEBUG=* node backup.js`
3. Verify Supabase keys have proper permissions
