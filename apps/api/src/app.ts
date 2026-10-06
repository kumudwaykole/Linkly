import express from "express";
import router from './router/link.router.js'

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/links", router);

export default app;