// Vercel serverless entry point. The filename `[...path].ts` is Vercel's file-system
// catch-all convention — every request under /api/* is routed here automatically,
// no rewrite rule needed. The Express app itself (routes, middleware, error handler)
// is the exact same `createApp()` used by the local dev server in server/src/index.ts;
// only the transport differs (a long-running `.listen()` there vs. one invocation per
// request here).
import { createApp } from "../server/src/app.js";

const app = createApp();

export default app;
