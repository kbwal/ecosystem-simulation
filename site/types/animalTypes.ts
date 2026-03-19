export type Animal = {
    id: number;
    name: string;
    author: string | null;
    color: string;
    age: number;
    energy: number;
    script: string;
    maxAge: number;
};

export type AnimalState = {
    readonly energy: number;
    readonly age: number;
    readonly position: { x: number; y: number };
    readonly nearbyFood: { deltaX: number; deltaY: number; value: number }[];
    readonly nearbyAnimals: { deltaX: number; deltaY: number; name: string }[];
};

export type AnimalAction = {
    move?: "r" | "l" | "u" | "d";
    eat?: boolean;
    reproduce?: boolean;
    sleep?: boolean;
    predate?: boolean;
};
