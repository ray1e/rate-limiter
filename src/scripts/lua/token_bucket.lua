local key = KEYS[1]
local capacity = tonumber(ARGV[1]) -- capacity of the bucket (the highest number of requests a user can make)
local refill_rate = tonumber(ARGV[2]) -- number of tokens to add after given interval
local refill_interval = tonumber(ARGV[3]) -- time passed before adding token
local now = tonumber(ARGV[4]) -- current time

-- Get current state
local bucket = redis.call("HMGET", key, "tokens", "last_refill") -- Get the token and last refill fields from the hash stored at that key
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

-- initialize on first request
if tokens == nil then
    tokens = capacity
    last_refill = now
end

-- calculate token refill
local time_elapsed = now - last_refill
local refills = math.floor(time_elapsed / refill_interval) -- refills is the number of times a bucket has been refilled

if refills > 0 then
    tokens = math.min(capacity, tokens + (refills * refill_rate))
    last_refill = last_refill + (refill_interval * refills)
end

-- check if there are enough tokens
local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end

-- update the state
redis.call("HMSET", key, "tokens", tokens, "last_refill", last_refill)

-- return result
return {allowed, tokens}
