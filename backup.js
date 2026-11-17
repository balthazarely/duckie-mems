require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_API_KEY; // Use secret API key for backup

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE environment variables');
  console.error('Add to .env.local:');
  console.error('  SUPABASE_SECRET_API_KEY=your_secret_api_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(process.cwd(), 'backups', timestamp);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 Starting backup to ${backupDir}`);

  try {
    // Backup posts table
    console.log('💾 Backing up posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');

    if (postsError) throw postsError;
    fs.writeFileSync(
      path.join(backupDir, 'posts.json'),
      JSON.stringify(posts, null, 2)
    );
    console.log(`  ✓ Saved ${posts.length} posts`);

    // Backup comments table
    console.log('💾 Backing up comments...');
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*');

    if (commentsError) throw commentsError;
    fs.writeFileSync(
      path.join(backupDir, 'comments.json'),
      JSON.stringify(comments, null, 2)
    );
    console.log(`  ✓ Saved ${comments.length} comments`);

    // Backup storage bucket
    console.log('💾 Backing up photos from storage...');
    const photosDir = path.join(backupDir, 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    const { data: files, error: filesError } = await supabase.storage
      .from('photos')
      .list('public', { limit: 1000 });

    if (filesError) throw filesError;

    let downloadedCount = 0;
    for (const file of files) {
      try {
        const { data, error } = await supabase.storage
          .from('photos')
          .download(`public/${file.name}`);

        if (error) {
          console.log(`  ⚠ Failed to download ${file.name}`);
          continue;
        }

        const buffer = await data.arrayBuffer();
        fs.writeFileSync(
          path.join(photosDir, file.name),
          Buffer.from(buffer)
        );
        downloadedCount++;
      } catch (err) {
        console.log(`  ⚠ Error downloading ${file.name}:`, err.message);
      }
    }
    console.log(`  ✓ Downloaded ${downloadedCount} photos`);

    // Create a summary file
    const summary = {
      backupDate: new Date().toISOString(),
      postsCount: posts.length,
      commentsCount: comments.length,
      photosCount: downloadedCount,
      location: backupDir,
    };
    fs.writeFileSync(
      path.join(backupDir, 'backup-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n✅ Backup completed successfully!');
    console.log(`📍 Location: ${backupDir}`);
    console.log(`\nSummary:`);
    console.log(`  - Posts: ${posts.length}`);
    console.log(`  - Comments: ${comments.length}`);
    console.log(`  - Photos: ${downloadedCount}`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

backup();
