# Stock Tracker (MERN)

A mobile-first, multi-tenant inventory management app — MongoDB, Express, React, Node.js.

Any shop or company can create its own workspace (a "company code"), with separate admin and employee logins. Data between companies is fully isolated.

## Project structure

```
stock-tracker/
├── server/     Express API + MongoDB (Mongoose)
├── client/     React app (Vite)
└── package.json   root scripts to run both together
```

In production, the Express server also serves the built React app as static files — so the whole thing runs as **one Node.js process** listening on one port. No separate frontend host needed.

## Features

- **Multi-tenant**: each company gets its own workspace, with isolated users, warehouses, stock, and logs
- **Self-serve signup**: create a company + admin account in one step at `/signup`
- **Admin Portal**: dashboard, stock management, warehouse management, employee accounts, activity logs
- **Employee Portal**: submit add/deduct/move requests with a party name — changes apply only after admin approval
- **Editable pending requests**: employees can edit their own request until it's reviewed; admins can edit a request's details in the same step as approving it
- **Multi-warehouse**: track stock across locations, with transfers between warehouses
- **Activity Logs**: full audit trail of who did what and when

## Prerequisites

- Node.js 18+
- MongoDB — either:
  - **Local**: install MongoDB Community Server ([docs](https://www.mongodb.com/docs/manual/administration/install-community/)) and run `mongod`
  - **Cloud (easiest)**: a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster — no local install needed

## Local development

```bash
npm run install:all   # installs root, server, and client dependencies
```

Create `server/.env` from the example and fill in your MongoDB connection string:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/stock-tracker
JWT_SECRET=<generate with: openssl rand -base64 48>
```

Then run both the API and the frontend together:

```bash
npm run dev
```

- API: http://localhost:4000
- App: http://localhost:5173 (open this one in your browser)

The Vite dev server proxies `/api/*` requests to the Express server, so the browser only ever talks to one origin.

Go to `/signup` to create your first company.

## Production build & run

```bash
npm run build   # builds the React app into client/dist
npm start        # starts the Express server, which also serves client/dist
```

Then visit whatever port your server is listening on (default `4000`, or whatever `PORT` you set) — the same server handles both the API and the app.

## Environment Variables (`server/.env`)

| Variable        | Required         | Description                                                                                                                                                     |
| --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`   | Yes              | Your MongoDB connection string                                                                                                                                  |
| `JWT_SECRET`    | Yes (production) | Secret used to sign session tokens. Generate with `openssl rand -base64 48`. Falls back to an insecure dev default if unset — never rely on that in production. |
| `NODE_ENV`      | No               | Set to `production` when deployed                                                                                                                               |
| `PORT`          | No               | Defaults to `4000`                                                                                                                                              |
| `CLIENT_ORIGIN` | No               | Only used in development, for CORS                                                                                                                              |

## Deploying

This app is a standard Node.js + MongoDB app, so it runs on almost any Node host:

### Render / Railway (recommended — simplest)

1. Push this repo to GitHub (see below).
2. Create a new **Web Service** from the repo.
3. Build command: `npm run install:all && npm run build`
4. Start command: `npm start`
5. Add environment variables: `MONGODB_URI` (point it at a MongoDB Atlas cluster — free tier works fine) and `JWT_SECRET`.
6. Deploy, then visit your app's URL and go to `/signup`.

### Any VPS (DigitalOcean, EC2, etc.)

```bash
git clone <your-repo-url>
cd stock-tracker
npm run install:all
npm run build
NODE_ENV=production MONGODB_URI="..." JWT_SECRET="..." npm start
```

Use a process manager like [pm2](https://pm2.keymetrics.io/) to keep it running:

```bash
npm install -g pm2
pm2 start server/index.js --name stock-tracker
```

Put it behind a reverse proxy (nginx or Caddy) for HTTPS.

### MongoDB Atlas setup (if you don't have MongoDB already)

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Under **Database Access**, create a database user with a password.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) — or your host's specific IP.
4. Click **Connect → Drivers**, copy the connection string, and put it in `MONGODB_URI` (replace `<password>` with your actual password, and add a database name at the end, e.g. `.../stock-tracker?retryWrites=true...`).

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Stock Tracker (MERN)"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Onboarding a new company

1. Go to `/signup`.
2. Enter a company name, and an admin username/password.
3. Note the **company code** shown after signup (also visible later on the admin Team page) — employees need it to log in.
4. From the admin Team page, create employee accounts; share the company code + their credentials with them.

## Notes on this MERN version

- Data isolation between companies is enforced at the application layer (every query is scoped by `companyId`) rather than by separate databases — standard practice for this style of multi-tenant app.
- Stock adjust/move operations use MongoDB's atomic `findOneAndUpdate` (with a quantity guard) rather than multi-document transactions, so this works on a plain standalone MongoDB — it doesn't require a replica set. (MongoDB Atlas clusters are replica sets by default, so this works there too.)
