// Vercel serverless entry point. A `vercel.json` rewrite sends every /api/*
// request here (see rewrites: "/api/(.*)" -> "/api"); Express then does its own
// routing on the original req.url. The Express app itself (routes, middleware,
// error handler) is the exact same `createApp()` used by the local dev server in
// server/src/index.ts; only the transport differs (a long-running `.listen()`
// there vs. one invocation per request here).
import { createApp } from "../server/src/app.js";

const app = createApp();

export default app;
