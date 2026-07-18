require('dotenv').config();
const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy .env.example to .env and add your MongoDB Atlas connection string.');
  process.exit(1);
}

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const client = new MongoClient(MONGODB_URI);
let projects;

function validId(id) {
  return ObjectId.isValid(id);
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/projects', async (req, res) => {
  try {
    const items = await projects
      .find({}, { projection: { name: 1, updatedAt: 1, createdAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not list projects.' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid project ID.' });
    const project = await projects.findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load project.' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const now = new Date();
    const project = {
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
      return res.status(413).json({ error: 'This project is too large for one MongoDB document. The next step is moving images to cloud storage.' });
    }
    res.status(500).json({ error: 'Could not save project.' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
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
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Project not found.' });
    res.json({ projectId: req.params.id });
  } catch (error) {
    console.error(error);
    if (String(error.message).includes('BSONObj size')) {
      return res.status(413).json({ error: 'This project is too large for one MongoDB document. The next step is moving images to cloud storage.' });
    }
    res.status(500).json({ error: 'Could not update project.' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid project ID.' });
    const result = await projects.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: 'Project not found.' });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await client.connect();
  const dbName = process.env.MONGODB_DB || 'makeup_board';
  projects = client.db(dbName).collection('projects');
  await projects.createIndex({ updatedAt: -1 });
  app.listen(PORT, () => {
    console.log(`Makeup Board running at http://localhost:${PORT}`);
  });
}

start().catch(error => {
  console.error('Failed to start:', error);
  process.exit(1);
});
