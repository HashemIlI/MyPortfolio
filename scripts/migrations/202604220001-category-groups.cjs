const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const PROJECT_CATEGORIES = [
  'Machine Learning',
  'Deep Learning',
  'NLP',
  'Computer Vision',
  'Data Analysis',
  'Business Intelligence',
  'Dashboard',
  'Web Scraping',
  'Other',
];

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const categoryGroups = mongoose.connection.collection('categorygroups');
  await categoryGroups.createIndex({ slug: 1 }, { unique: true });
  await categoryGroups.createIndex({ visible: 1, sortOrder: 1 });
  await categoryGroups.createIndex({ sourceCategories: 1 });

  const now = new Date();
  for (const [index, category] of PROJECT_CATEGORIES.entries()) {
    await categoryGroups.updateOne(
      { slug: slugify(category) },
      {
        $setOnInsert: {
          name: category,
          slug: slugify(category),
          description: '',
          sourceCategories: [category],
          visible: true,
          sortOrder: index,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true }
    );
  }

  console.log(`Category group migration complete: ${PROJECT_CATEGORIES.length} defaults ensured.`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
