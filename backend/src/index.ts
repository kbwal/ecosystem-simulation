import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./appRouter";
import { createTRPCContext } from "./trpc";
import "dotenv/config";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(
    "/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext: createTRPCContext,
    }),
);

app.get("/", (req, res) => {
    res.send("Backend is running");
});

const PORT = process.env.PORT || 3001;
app.listen(Number(PORT), "0.0.0.0", async () => {
    console.log(`Backend on :${PORT}`);
});
