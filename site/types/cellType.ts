import { Animal } from "./animalTypes";

export type CellType = {
    animal: Animal | null;
    food: {
        value: number;
    } | null;
};
