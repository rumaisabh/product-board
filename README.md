# Product Board
## Live Website

[Open Product Board](https://product-board-95gc.onrender.com)

A web-based product moodboard editor for uploading, cropping, arranging, and saving product images.

## Live Website

[Open Product Board](https://product-board-95gc.onrender.com)

> The free Render server may take up to 50 seconds to wake after inactivity.

## Features

* Email and Google authentication
* Private projects for each user
* Upload and crop product images
* Optional background removal
* Drag, resize, rotate, and layer items
* Add editable text
* Zoom and pan across the canvas
* Save and load projects
* Export boards as PNG

## Built With

* Fabric.js
* JavaScript, HTML, and CSS
* Node.js and Express
* MongoDB Atlas
* Clerk
* Render

## Run Locally

Clone the repository and install the dependencies:

```bash
npm install
```

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
LEGACY_CLAIM_CODE=your_private_claim_code
```

Start the server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Security

Private keys and database credentials must only be stored in `.env` locally or in Render environment variables. Never upload `.env` to GitHub.

## Planned Improvements

* Cloud image storage
* Automatic project reopening
* Improved autosave
* Undo and redo
* Product folders and categories
* Improved mobile layout

