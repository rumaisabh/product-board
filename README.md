# Makeup Board with MongoDB Save/Load

This version keeps the existing Fabric.js editor and adds:

- Project name
- Save Project
- Load Project
- Delete saved project
- New Project
- Autosave every 5 seconds after the first successful save
- MongoDB-backed canvas, tray-image, zoom, pan, text, rotation, and position storage

## Important

Do not double-click `index.html` for this version. It now needs the included Node server.

## Run locally

1. Install Node.js 18 or newer.
2. Create a free MongoDB Atlas cluster.
3. Copy `.env.example` to a new file named `.env`.
4. Paste your Atlas connection string into `MONGODB_URI`.
5. In Terminal, open this folder and run:

```bash
npm install
npm start
```

6. Open:

```text
http://localhost:3000
```

## Current storage approach

For this first database-saving step, uploaded and cropped images are saved as Base64 image data inside the project document. MongoDB documents have a size limit, so a board with many large images may eventually become too large. The next development step should upload image files to Cloudinary or another file-storage service, then keep only their URLs in MongoDB.

## Deployment note

GitHub Pages can host only the browser frontend and cannot run this Node server. Deploy the complete project to a Node-compatible service, or deploy the frontend and backend separately. Do not publish the `.env` file or MongoDB password to GitHub.
