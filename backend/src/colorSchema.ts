import { z } from "zod";

export const colorSchema = z
    .string()
    .regex(/^\d{1,3},\d{1,3},\d{1,3}$/)
    .refine((val) => {
        const parts = val.split(",").map(Number);
        return parts.every((n) => n >= 0 && n <= 255);
    });
