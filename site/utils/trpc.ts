import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../backend/src/appRouter";

export const trpc = createTRPCReact<AppRouter>();
