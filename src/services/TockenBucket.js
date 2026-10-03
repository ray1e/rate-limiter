import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const scriptPath = path.resolve(
  import.meta.dirname,
  "../scripts/lua/token_bucket.lua"
);
const TOKEN_BUCKET_SCRIPT = fs.readFileSync(scriptPath, "utf8");

/*
const limiter = TokenBucket({
    capacity: 10,
    refillRate: 1,
    refillInterval: 1.0,
    redisClient: client
})

const [alowed, remaining] = await limiter.allow("user:123")
*/

export class TokenBucket {
  constructor({
    capacity = 10,
    refillRate = 1,
    refillInterval = 1,
    redisClient,
  } = {}) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    if (!redisClient) {
      throw new Error("TokenBucket requires a Redis client");
    }
    this.redis = redisClient;

    /*this hash is created incase the scriptwas already loaded in redis but redis was flushed - since
    the ensureScriptLoaded fuunction only runs if the script is not loaded
    */
    this._scriptSha = crypto
      .createHash("sha1")
      .update(TOKEN_BUCKET_SCRIPT)
      .digest("hex");
    this._scriptLoaded = false;
  }

  async _ensureScriptLoaded() {
    if (!this._scriptLoaded) {
      this._scriptSha = await this.redis.scriptLoad(TOKEN_BUCKET_SCRIPT);
      this._scriptLoaded = true;
    }
  }

  async allow(key) {
    await this._ensureScriptLoaded();

    const now = Date.now() / 1000; //time in seconds

    //try to run script using evalSha if not use EVAL
    let result;
    try {
      result = await this.redis.evalSha(this._scriptSha, {
        keys: [key],
        arguments: [
          String(this.capacity),
          String(this.refillRate),
          String(this.refillInterval),
          String(now),
        ],
      });
    } catch (error) {
      if (error.message.includes("NOSCRIPT")) {
        result = await this.redis.eval(TOKEN_BUCKET_SCRIPT, {
          keys: [key],
          arguments: [
            String(this.capacity),
            String(this.refillRate),
            String(this.refillInterval),
            String(now),
          ],
        });
        this._scriptLoaded = false;
      } else {
        throw error;
      }
    }
    const allowed = Boolean(result[0]);
    const remaining = Number(result[1]);

    return { allowed, remaining };
  }
}
