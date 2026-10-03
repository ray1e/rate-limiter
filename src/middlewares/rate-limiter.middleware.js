import { createClient } from "redis";
import ENV from "../config/env.js";
import { TokenBucket } from "../services/TockenBucket.js";

if (!ENV.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

const redisClient = createClient({
  url: ENV.REDIS_URL,
});

await redisClient.connect();

const TARGET_BASE_URL = "https://jsonplaceholder.typicode.com"
const limiter = new TokenBucket({
  capacity: 5,
  refillRate: 1,
  refillInterval: 5.0,
  redisClient,
});

export const requestAllowed = async (req, res, next) => {
  const targetUrl = `${TARGET_BASE_URL}${req.originalUrl}`;

  const {allowed, remaining} = await limiter.allow("user:123");

  try {
    if (allowed) {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          Accept: "application/json",
        },
      });
      const data = await response.json();

      // 2. Return the external API's response directly to your client
      res.status(response.status).json({remainingRequests: remaining, data});
    } else {
      res.status(429).json({ error: "Too Many Requests" });
    }
  } catch (error) {
    next(error);
  }
};
