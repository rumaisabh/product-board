require('dotenv').config();
const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { clerkMiddleware, getAuth } = require('@clerk/express');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

for (const [name, value] of Object.entries({ MONGODB_URI, CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY })) {
  if (!value) {
    console.error(`Missing ${name}. Add it to .env locally and Render Environment Variables online.`);
    process.exit(1);
  }
}

app.use(express.json({ limit: '15mb' }));
app.use(clerkMiddleware());
app.use(express.static(path.join(__dirname, 'public')));

const client = new MongoClient(MONGODB_URI);
let projects;

function validId(id) {
  return ObjectId.isValid(id);
}

function requireUser(req, res, next) {
  const auth = getAuth(req);
  if (!auth.isAuthenticated || !auth.userId) {
    return res.status(401).json({ error: 'Sign in is required.' });
  }
  req.userId = auth.userId;
  next();
}

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/config', (req, res) => {
  res.json({ clerkPublishableKey: CLERK_PUBLISHABLE_KEY });
});

app.get('/api/projects', requireUser, async (req, res) => {
  try {
    const items = await projects
      .find({ ownerId: req.userId }, { projection: { name: 1, updatedAt: 1, createdAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not list projects.' });
  }
});

app.get('/api/projects/:id', requireUser, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid project ID.' });
    const project = await projects.findOne({ _id: new ObjectId(req.params.id), ownerId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load project.' });
  }
});

app.post('/api/projects', requireUser, async (req, res) => {
  try {
    const now = new Date();
    const project = {
      ownerId: req.userId,
      name: req.body.name || 'Untitled Makeup Board',
      canvasJson: req.body.canvasJson || { objects: [] },
      viewportTransform: req.body.viewportTransform || [1, 0, 0, 1, 0, 0],
      trayAssets: Array.isArray(req.body.trayAssets) ? req.body.trayAssets : [],
      previewDataUrl: req.body.previewDataUrl || '',
      createdAt: now,
      updatedAt: now
    };
    const result = await projects.insertOne(project);
    res.status(201).json({ projectId: result.insertedId.toString() });
  } catch (error) {
    console.error(error);
    if (String(error.message).includes('BSONObj size')) {
      return res.status(413).json({ error: 'This project is too large for one MongoDB document. Move images to cloud storage next.' });
    }
    res.status(500).json({ error: 'Could not save project.' });
  }
});

app.put('/api/projects/:id', requireUser, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid project ID.' });
    const update = {
      name: req.body.name || 'Untitled Makeup Board',
      canvasJson: req.body.canvasJson || { objects: [] },
      viewportTransform: req.body.viewportTransform || [1, 0, 0, 1, 0, 0],
      trayAssets: Array.isArray(req.body.trayAssets) ? req.body.trayAssets : [],
      previewDataUrl: req.body.previewDataUrl || '',
      updatedAt: new Date()
    };
    const result = await projects.updateOne(
      { _id: new ObjectId(req.params.id), ownerId: req.userId },
      { $set: update }
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Project not found.' });
    res.json({ projectId: req.params.id });
  } catch (error) {
    console.error(error);
    if (String(error.message).includes('BSONObj size')) {
      return res.status(413).json({ error: 'This project is too large for one MongoDB document. Move images to cloud storage next.' });
    }
    res.status(500).json({ error: 'Could not update project.' });
  }
});

app.delete('/api/projects/:id', requireUser, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid project ID.' });
    const result = await projects.deleteOne({ _id: new ObjectId(req.params.id), ownerId: req.userId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Project not found.' });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

// One-time migration for projects saved before accounts were added.
// Set LEGACY_CLAIM_CODE privately in .env/Render, then enter that code in the app.
app.post('/api/projects/claim-legacy', requireUser, async (req, res) => {
  const expected = process.env.LEGACY_CLAIM_CODE;
  if (!expected) return res.status(404).json({ error: 'Legacy claiming is not enabled.' });
  if (!req.body || req.body.code !== expected) return res.status(403).json({ error: 'Invalid claim code.' });
  try {
    const result = await projects.updateMany(
      { ownerId: { $exists: false } },
      { $set: { ownerId: req.userId, updatedAt: new Date() } }
    );
    res.json({ claimed: result.modifiedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not claim legacy projects.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await client.connect();
  const dbName = process.env.MONGODB_DB || 'makeup_board';
  projects = client.db(dbName).collection('projects');
  await projects.createIndex({ ownerId: 1, updatedAt: -1 });
  app.listen(PORT, () => {
    console.log(`Product Board running at http://localhost:${PORT}`);
  });
}

start().catch(error => {
  console.error('Failed to start:', error);
  process.exit(1);
});
