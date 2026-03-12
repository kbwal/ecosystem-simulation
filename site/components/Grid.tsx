"use client";
import { useEffect, useRef } from "react";
import { Stage, Layer, Shape } from "react-konva";
import Konva from "konva";
import { Animal } from "@/types/animalTypes";
import { trpc } from "@/utils/trpc";
import ts from "typescript";

export default function Grid({ cellSize = 3 }) {
    const GRID = 250;
    const canvasSize = GRID * cellSize;

    const MOVEMENT_COST = 2;
    const METABOLISM_COST = 1;
    const SLEEPING_BONUS = 20;
    const REPRODUCTION_COST = 25;

    function contains(i: number, j: number) {
        return i <= GRID - 1 && i >= 0 && j <= GRID - 1 && j >= 0;
    }

    const fetchAnimalsQuery = trpc.getAllAnimals.useQuery();
    const dbAnimals = fetchAnimalsQuery.data;
    const baseSpeciesRef = useRef<Animal[]>([]);
    const cells = useRef<ReturnType<typeof initCells> | null>(null);

    function initCells(loadedAnimals: Animal[]) {
        return Array.from({ length: GRID }, () =>
            Array.from({ length: GRID }, () => {
                const rand = Math.random();
                if (rand < 0.01) {
                    return {
                        animal: {
                            ...loadedAnimals[Math.floor(Math.random() * loadedAnimals.length)],
                            energy: Math.floor(Math.random() * 100),
                        },
                        food: { value: Math.random() },
                    };
                } else if (rand < 0.1) {
                    return {
                        animal: {
                            ...loadedAnimals[Math.floor(Math.random() * loadedAnimals.length)],
                            energy: Math.floor(Math.random() * 100),
                        },
                        food: null,
                    };
                } else if (rand < 0.2) {
                    return { animal: null, food: { value: Math.random() } };
                } else {
                    return { animal: null, food: null };
                }
            }),
        );
    }

    useEffect(() => {
        if (!dbAnimals) return;
        baseSpeciesRef.current = [];
        for (const currentAnimal of dbAnimals) {
            const jsRawScript = ts.transpileModule(currentAnimal.script, {
                compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
            }).outputText;
            const fn = new Function(`return (${jsRawScript})`)();
            baseSpeciesRef.current.push({ ...currentAnimal, energy: 0, age: 0, script: { tick: fn } });
        }
        cells.current = initCells(baseSpeciesRef.current);
    }, [dbAnimals]);

    const layerRef = useRef<Konva.Layer>(null);
    useEffect(() => {
        let rafId: number;
        let lastTime = 0;
        const MS_PER_TICK = 1000;
        let numTicks = 0;
        const sleepingAnimals = new WeakMap<object, number>();

        const tick = (timestamp: number) => {
            if (!cells.current) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            const animalPerformedActionThisTick = new Set();
            if (timestamp - lastTime >= MS_PER_TICK) {
                numTicks++;
                lastTime = timestamp;
                for (let i = 0; i < GRID; i++) {
                    for (let j = 0; j < GRID; j++) {
                        const cell = cells.current[i][j];
                        if (!cell || animalPerformedActionThisTick.has(cell.animal)) continue;
                        const animal = cell.animal;
                        const food = cell.food;

                        if (animal) {
                            animal.age++;
                            animalPerformedActionThisTick.add(animal);

                            const nearbyFood: { distance: number; direction: "r" | "l" | "u" | "d"; value: number }[] = [];
                            const nearbyAnimals: { distance: number; direction: "r" | "l" | "u" | "d" }[] = [];
                            for (let delta = -3; delta < 4; delta++) {
                                if (contains(i + delta, j) && delta != 0) {
                                    const currentFood = cells.current[i + delta][j].food;
                                    const currentAnimal = cells.current[i + delta][j].animal;
                                    if (currentFood != null) {
                                        nearbyFood.push({
                                            distance: delta,
                                            direction: delta < 0 ? "u" : "d",
                                            value: currentFood.value,
                                        });
                                    }
                                    if (currentAnimal != null) {
                                        nearbyAnimals.push({
                                            distance: delta,
                                            direction: delta < 0 ? "u" : "d",
                                        });
                                    }
                                }
                            }
                            for (let delta = -3; delta < 4; delta++) {
                                if (contains(i, j + delta) && delta != 0) {
                                    const currentFood = cells.current[i][j + delta].food;
                                    const currentAnimal = cells.current[i][j + delta].animal;
                                    if (currentFood != null) {
                                        nearbyFood.push({
                                            distance: delta,
                                            direction: delta < 0 ? "l" : "r",
                                            value: currentFood.value,
                                        });
                                    }
                                    if (currentAnimal != null) {
                                        nearbyAnimals.push({
                                            distance: delta,
                                            direction: delta < 0 ? "l" : "r",
                                        });
                                    }
                                }
                            }

                            const action = animal.script.tick({
                                energy: animal.energy,
                                age: animal.age,
                                nearbyFood: nearbyFood,
                                nearbyAnimals: nearbyAnimals,
                            });

                            if (!action) {
                                animal.energy -= METABOLISM_COST;
                                continue;
                            }

                            const direction = action.move;
                            const eat = action.eat;
                            const reproduce = action.reproduce;
                            const sleep = action.sleep;
                            const predate = action.predate;

                            if (animal.energy <= 0 || animal.age > animal.maxAge) {
                                cells.current[i][j] = {
                                    animal: null,
                                    food: null,
                                };
                                continue;
                            }

                            const howLongAsleep = sleepingAnimals.get(animal);
                            if (howLongAsleep != undefined) {
                                if (howLongAsleep < animal.maxAge * 0.15) {
                                    sleepingAnimals.set(animal, howLongAsleep + 1);
                                    continue;
                                } else {
                                    sleepingAnimals.delete(animal);
                                }
                            }

                            if (direction) {
                                animal.energy -= MOVEMENT_COST + animal.age * 0.01;
                                if (direction == "u" && contains(i - 1, j) && !cells.current[i - 1][j].animal) {
                                    cells.current[i - 1][j] = {
                                        animal: cell.animal,
                                        food: cells.current[i - 1][j].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                } else if (direction == "d" && contains(i + 1, j) && !cells.current[i + 1][j].animal) {
                                    cells.current[i + 1][j] = {
                                        animal: cell.animal,
                                        food: cells.current[i + 1][j].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                } else if (direction == "l" && contains(i, j - 1) && !cells.current[i][j - 1].animal) {
                                    cells.current[i][j - 1] = {
                                        animal: cell.animal,
                                        food: cells.current[i][j - 1].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                } else if (direction == "r" && contains(i, j + 1) && !cells.current[i][j + 1].animal) {
                                    cells.current[i][j + 1] = {
                                        animal: cell.animal,
                                        food: cells.current[i][j + 1].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                }
                            } else if (eat) {
                                const currentCellFood = cells.current[i][j].food;
                                if (currentCellFood != null) {
                                    animal.energy += currentCellFood.value * 5;
                                    cells.current[i][j] = {
                                        animal: animal,
                                        food: null,
                                    };
                                }
                            } else if (sleep) {
                                sleepingAnimals.set(animal, 1);
                                animal.energy += SLEEPING_BONUS;
                            } else if (predate) {
                                if (contains(i - 1, j) && cells.current[i - 1][j].animal) {
                                    const preyEnergy = cells.current[i - 1][j].animal?.energy;
                                    if (preyEnergy != undefined) {
                                        animal.energy += preyEnergy * 0.1;
                                    }
                                    cells.current[i - 1][j] = {
                                        animal: cell.animal,
                                        food: cells.current[i - 1][j].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                } else if (contains(i + 1, j) && cells.current[i + 1][j].animal) {
                                    const preyEnergy = cells.current[i + 1][j].animal?.energy;
                                    if (preyEnergy != undefined) {
                                        animal.energy += preyEnergy * 0.1;
                                    }
                                    cells.current[i + 1][j] = {
                                        animal: cell.animal,
                                        food: cells.current[i + 1][j].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                } else if (contains(i, j - 1) && cells.current[i][j - 1].animal) {
                                    const preyEnergy = cells.current[i][j - 1].animal?.energy;
                                    if (preyEnergy != undefined) {
                                        animal.energy += preyEnergy * 0.1;
                                    }
                                    cells.current[i][j - 1] = {
                                        animal: cell.animal,
                                        food: cells.current[i][j - 1].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                } else if (contains(i, j + 1) && cells.current[i][j + 1].animal) {
                                    const preyEnergy = cells.current[i][j + 1].animal?.energy;
                                    if (preyEnergy != undefined) {
                                        animal.energy += preyEnergy * 0.1;
                                    }
                                    cells.current[i][j + 1] = {
                                        animal: cell.animal,
                                        food: cells.current[i][j + 1].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                }
                            } else if (reproduce) {
                                const newAnimal: Animal = {
                                    ...animal,
                                    energy: Math.floor(Math.random() * 100),
                                    age: 0,
                                    maxAge: (Math.random() - 0.5) * 3 + animal.maxAge,
                                };

                                if (contains(i - 1, j) && !cells.current[i - 1][j].animal) {
                                    cells.current[i - 1][j] = {
                                        animal: newAnimal,
                                        food: cells.current[i - 1][j].food,
                                    };
                                } else if (contains(i + 1, j) && !cells.current[i + 1][j].animal) {
                                    cells.current[i + 1][j] = {
                                        animal: newAnimal,
                                        food: cells.current[i + 1][j].food,
                                    };
                                } else if (contains(i, j - 1) && !cells.current[i][j - 1].animal) {
                                    cells.current[i][j - 1] = {
                                        animal: newAnimal,
                                        food: cells.current[i][j - 1].food,
                                    };
                                } else if (contains(i, j + 1) && !cells.current[i][j + 1].animal) {
                                    cells.current[i][j + 1] = {
                                        animal: newAnimal,
                                        food: cells.current[i][j + 1].food,
                                    };
                                }
                                animal.energy -= REPRODUCTION_COST;
                            }

                            animal.energy -= METABOLISM_COST;
                        }

                        if (food == null && Math.random() < Math.max(0.05 / numTicks, 0.001)) {
                            cells.current[i][j].food = {
                                value: Math.random(),
                            };
                        }
                    }
                }
                layerRef.current?.batchDraw();
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafId);
    }, []);

    const drawScene = (ctx: Konva.Context) => {
        if (!cells.current) {
            return;
        }
        ctx.fillStyle = "#000";

        ctx.fillRect(0, 0, canvasSize, canvasSize);

        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                const cell = cells.current[y][x];
                const animal = cell.animal;
                if (animal != null) {
                    ctx.fillStyle = `rgb(${animal.color})`;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
                // const food = cell.food;
                // if (food != null) {
                //     ctx.fillStyle = `rgb(255, 255, 255)`;
                //     ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                // }
            }
        }

        if (cellSize >= 4) {
            ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= GRID; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0);
                ctx.lineTo(i * cellSize, canvasSize);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * cellSize);
                ctx.lineTo(canvasSize, i * cellSize);
                ctx.stroke();
            }
        }
    };

    return (
        <Stage width={canvasSize} height={canvasSize}>
            <Layer ref={layerRef}>
                <Shape width={canvasSize} height={canvasSize} sceneFunc={(ctx) => drawScene(ctx)} />
            </Layer>
        </Stage>
    );
}
