import dotenv from "dotenv";

dotenv.config();

const ENV = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URL: process.env.REDIS_URL,
}

export default ENV;