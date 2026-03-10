export type Animal = {
    id: number;
    name: string;
    author: string | null;
    color: string;
    age: number;
    energy: number;
    script: AnimalScript;
    maxAge: number;
};

export type AnimalState = {
    readonly energy: number;
    readonly age: number;
    // readonly position: { x: number; y: number };
    readonly nearbyFood: { distance: number; direction: "r" | "l" | "u" | "d" }[];
    readonly nearbyAnimals: { distance: number; direction: "r" | "l" | "u" | "d" }[];
};

export type AnimalAction = {
    move?: "r" | "l" | "u" | "d";
    eat?: boolean;
    reproduce?: boolean;
    sleep?: boolean;
    predate?: boolean;
};

export type AnimalScript = {
    tick(state: AnimalState): AnimalAction;
};
