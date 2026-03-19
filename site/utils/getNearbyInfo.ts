import { AnimalState } from "@/types/animalTypes";
import { contains } from "./contains";
import { CellType } from "@/types/cellType";

export function getNearbyInfo(i: number, j: number, maxDelta: number, GRID: number, cells: CellType[][]) {
    const nearbyAnimals: AnimalState["nearbyAnimals"] = [];
    const nearbyFood: AnimalState["nearbyFood"] = [];
    for (let deltaX = -maxDelta; deltaX <= maxDelta; deltaX++) {
        for (let deltaY = -maxDelta; deltaY <= maxDelta; deltaY++) {
            let newI = i + deltaY;
            let newJ = j + deltaX;
            if (contains(newI, newJ, GRID) && (deltaX != 0 || deltaY != 0)) {
                const currentFood = cells[newI][newJ].food;
                const currentAnimal = cells[newI][newJ].animal;
                if (currentFood != null) {
                    nearbyFood.push({
                        deltaX,
                        deltaY,
                        value: currentFood.value,
                    });
                }
                if (currentAnimal != null) {
                    nearbyAnimals.push({
                        deltaX,
                        deltaY,
                        name: currentAnimal.name,
                    });
                }
            }
        }
    }

    return { nearbyFood, nearbyAnimals };
}
