import { contains } from "./contains";
import { CellType } from "@/types/cellType";

export function getNearbyInfo(i: number, j: number, maxDelta: number, GRID: number, cells: CellType[][]) {
    const nearbyAnimals: { distance: number; direction: "r" | "l" | "u" | "d" }[] = [];
    const nearbyFood: { distance: number; direction: "r" | "l" | "u" | "d"; value: number }[] = [];
    for (let delta = -3; delta < maxDelta; delta++) {
        if (contains(i + delta, j, GRID) && delta != 0) {
            const currentFood = cells[i + delta][j].food;
            const currentAnimal = cells[i + delta][j].animal;
            if (currentFood != null) {
                nearbyFood.push({
                    distance: Math.abs(delta),
                    direction: delta < 0 ? "u" : "d",
                    value: currentFood.value,
                });
            }
            if (currentAnimal != null) {
                nearbyAnimals.push({
                    distance: Math.abs(delta),
                    direction: delta < 0 ? "u" : "d",
                });
            }
        }
    }

    for (let delta = -3; delta < maxDelta; delta++) {
        if (contains(i, j + delta, GRID) && delta != 0) {
            const currentFood = cells[i][j + delta].food;
            const currentAnimal = cells[i][j + delta].animal;
            if (currentFood != null) {
                nearbyFood.push({
                    distance: Math.abs(delta),
                    direction: delta < 0 ? "l" : "r",
                    value: currentFood.value,
                });
            }
            if (currentAnimal != null) {
                nearbyAnimals.push({
                    distance: Math.abs(delta),
                    direction: delta < 0 ? "l" : "r",
                });
            }
        }
    }

    return { nearbyFood, nearbyAnimals };
}
