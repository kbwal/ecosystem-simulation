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
    const random = Math.random();
    if (energy < 5) {
        return { sleep: true };
    } else if (random < 0.5) {
        return {
            eat: true,
        };
    } else if (random < 0.75) {
        return {
            move: "u",
        };
    } else {
        return {
            move: "d",
        };
    }
}
