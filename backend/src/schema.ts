import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { colorSchema } from "./colorSchema";

export const animals = pgTable("animals", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    author: varchar({ length: 255 }).notNull(),
    color: varchar({ length: 11 }).notNull(),
    maxAge: integer().notNull(),
    script: text().notNull(),
});

export const insertAnimalSchema = createInsertSchema(animals, {
    color: colorSchema,
});
