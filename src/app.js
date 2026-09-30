import express from "express";
import ENV from "./config/env.js";

const app = express();
app.use(express.json());

const TARGET_BASE_URL = 'https://jsonplaceholder.typicode.com';

// Catch-all route that proxies any incoming request
app.use(async (req, res) => {
  const targetUrl = `${TARGET_BASE_URL}${req.originalUrl}`;

  try {
    // 1. Forward the exact method, path, and headers to the upstream API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // 2. Return the external API's response directly to your client
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Bad Gateway - Failed to reach target API' });
  }
});

const startServer = () => {
    app.listen(ENV.PORT, () => {
        console.log(`Server is running on port ${ENV.PORT}`);
    })
}

startServer();