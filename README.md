# Product Board with private user accounts

Fabric.js product moodboard editor with MongoDB saving and Clerk authentication.

## What this version adds

- Email/Google sign-in through Clerk
- Separate private projects for every signed-in user
- Server-side authorization on list, load, save, update, and delete routes
- Existing project claim tool for pre-account projects
- Existing crop, background removal, tray, infinite board, rotation, resize, save/load, and autosave features

## Local setup

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your MongoDB Atlas connection string.
5. In Clerk, open **Configure > API Keys** and copy the development Publishable Key and Secret Key into `.env`.
6. Run `npm start`.
7. Open `http://localhost:3000`.

## Render environment variables

Add these under Render > product-board > Environment:

- `MONGODB_URI`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `LEGACY_CLAIM_CODE` (temporary and optional)

Do not upload `.env` to GitHub.

## Claiming old projects

Projects created before authentication do not have an `ownerId`, so they are hidden after this update.

1. Add a long private `LEGACY_CLAIM_CODE` in local `.env` and Render.
2. Deploy and sign in with your own account.
3. Open **Load Project** and click **Claim my pre-account projects**.
4. Enter the code.
5. After confirming your projects appear, remove `LEGACY_CLAIM_CODE` from Render and `.env`.

This assigns every ownerless legacy project to the signed-in account. Only run it once as the intended owner.
