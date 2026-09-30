import express from "express";
import ENV from "./config/env.js";
import { proxy } from "./middlewares/proxy.middleware.js";

const app = express();
app.use(express.json());



// Catch-all route that proxies any incoming request
app.use(proxy());

const startServer = () => {
    app.listen(ENV.PORT, () => {
        console.log(`Server is running on port ${ENV.PORT}`);
    })
}

startServer();