// Local development entry point — a plain, always-on Node process. The exact same
// `createApp()` Express app is also used by api/index.ts for the Vercel serverless
// deployment; this file just adds the `.listen()` a serverless function can't have.
import "dotenv/config";
import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Shogi Dojo API listening on http://localhost:${port}`);
});
