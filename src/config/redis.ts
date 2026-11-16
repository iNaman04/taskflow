import "dotenv/config";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
});

export default redisConnection;