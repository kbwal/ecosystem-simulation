import { z } from "zod";

export const colorSchema = z
    .string()
    .min(1)
    .max(11)
    .regex(/^\d{1,3},\d{1,3},\d{1,3}$/, "Format should be rgb!")
    .refine((val) => {
        const parts = val.split(",").map(Number);
        return parts.every((n) => n >= 0 && n <= 255);
    });

export const scriptSchema = z
    .string()
    .min(4)
    .refine((val) => {
        return val.includes("tick");
    });

export const submissionSchema = z.object({
    name: z.string().min(1),
    author: z.string().min(1),
    color: colorSchema,
    maxAge: z.number().gte(0),
    script: scriptSchema,
});

export type submissionSchemaType = z.infer<typeof submissionSchema>;
