import { initTRPC } from "@trpc/server";
import { db } from "./db";

export const createTRPCContext = () => {
    return {
        db,
    };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
