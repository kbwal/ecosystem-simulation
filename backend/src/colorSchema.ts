import { number, z } from "zod";

export const colorSchema = z
    .string()
    .regex(/^\d{1,3},\d{1,3},\d{1,3}$/, "Format should be rgb!")
    .refine((val) => {
        const parts = val.split(",").map(number);
        return parts.every((n) => n.lte(255) && n.gte(0));
    });
