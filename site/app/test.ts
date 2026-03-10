function tick({
    energy,
    age,
    nearbyFood,
    nearbyAnimals,
}: {
    energy: number;
    age: number;
    nearbyFood: { distance: number; direction: "r" | "l" | "u" | "d" }[];
    nearbyAnimals: { distance: number; direction: "r" | "l" | "u" | "d" }[];
}) {
    if (energy < 10) {
        return {
            reproduce: true,
        };
    } else {
        return {
            move: "d",
        };
    }
}
