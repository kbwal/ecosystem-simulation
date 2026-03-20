"use client";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Shape } from "react-konva";
import Konva from "konva";
import { Animal } from "@/types/animalTypes";
import { trpc } from "@/utils/trpc";
import ts from "typescript";
import { KonvaEventObject } from "konva/lib/Node";
import AnimalInfo from "./AnimalInfo";
import { getAdjIndexes } from "@/utils/getAdjIndexes";
import { getRandomDirections } from "@/utils/getRandomDirections";
import { contains } from "@/utils/contains";
import { CellType } from "@/types/cellType";
import { getNearbyInfo } from "@/utils/getNearbyInfo";
import { runScriptSafely } from "@/utils/runScriptSafely";
import { newQuickJSWASMModule, QuickJSWASMModule } from "quickjs-emscripten";
import { Spinner } from "@/components/ui/spinner";

export default function Grid({ cellSize = 3 }) {
    const [loading, setLoading] = useState(true);
    const [hoveredCell, setHoveredCell] = useState<Animal | null>(null);

    const GRID = 50;
    const canvasSize = GRID * cellSize;

    const MOVEMENT_COST = 1;
    const METABOLISM_COST = 1;
    const SLEEPING_BONUS = 20;
    const REPRODUCTION_COST = 25;

    function handleHover(e: KonvaEventObject<MouseEvent>) {
        const pointerPosition = e.target.getStage()?.getPointerPosition();
        if (!pointerPosition) {
            return;
        }
        const row = Math.floor(pointerPosition.y / cellSize);
        const col = Math.floor(pointerPosition.x / cellSize);

        if (cells.current && contains(row, col, GRID) && cells.current[row][col].animal != null) {
            const animal = cells.current[row][col].animal;
            setHoveredCell(animal);
        } else {
            setHoveredCell(null);
        }
    }

    const quickJSRef = useRef<QuickJSWASMModule | null>(null);
    useEffect(() => {
        newQuickJSWASMModule().then((QuickJSModule) => {
            quickJSRef.current = QuickJSModule;
        });
    }, []);

    const fetchAnimalsQuery = trpc.getAllAnimals.useQuery();
    const dbAnimals = fetchAnimalsQuery.data;
    const baseSpeciesRef = useRef<Animal[]>([]);
    const cells = useRef<CellType[][]>(null);

    function initCells(loadedAnimals: Animal[]) {
        setLoading(false);
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
            baseSpeciesRef.current.push({ ...currentAnimal, energy: 0, age: 0, script: jsRawScript, lastAction: null });
        }
        cells.current = initCells(baseSpeciesRef.current);
    }, [dbAnimals]);

    const layerRef = useRef<Konva.Layer>(null);
    useEffect(() => {
        let rafId: number;
        let lastTime = 0;
        let numTicks = 0;
        const msPerTick = 100;
        const sleepingAnimals = new WeakMap<object, number>();

        const tick = (timestamp: number) => {
            if (!cells.current) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            const animalPerformedActionThisTick = new Set();
            if (timestamp - lastTime >= msPerTick) {
                numTicks++;
                lastTime = timestamp;

                const vm = quickJSRef.current?.newContext();
                // 16 mb shared for the entire context
                // this should be recycled constantly though
                vm?.runtime.setMemoryLimit(2 ** 10 * 2 ** 10 * 16);

                for (let i = 0; i < GRID; i++) {
                    for (let j = 0; j < GRID; j++) {
                        const cell = cells.current[i][j];
                        if (!cell || animalPerformedActionThisTick.has(cell.animal)) continue;
                        const animal = cell.animal;
                        const food = cell.food;

                        if (animal && vm) {
                            animal.age++;
                            animalPerformedActionThisTick.add(animal);

                            const { nearbyAnimals, nearbyFood } = getNearbyInfo(i, j, 4, GRID, cells.current);

                            const action = runScriptSafely(
                                vm,
                                {
                                    age: animal.age,
                                    energy: animal.energy,
                                    nearbyAnimals: nearbyAnimals,
                                    nearbyFood: nearbyFood,
                                    position: {
                                        x: j,
                                        y: i,
                                    },
                                },
                                animal.script.toString(),
                            );

                            animal.energy -= METABOLISM_COST + Math.pow(animal.age / 50, 1.5);

                            if (animal.energy <= 0) {
                                cells.current[i][j] = {
                                    animal: null,
                                    food: cells.current[i][j].food,
                                };
                                continue;
                            }

                            if (!action) continue;

                            const direction = action.move;
                            const eat = action.eat;
                            const reproduce = action.reproduce;
                            const sleep = action.sleep;
                            const predate = action.predate;

                            const howLongAsleep = sleepingAnimals.get(animal);
                            if (howLongAsleep != undefined) {
                                if (howLongAsleep < 10) {
                                    sleepingAnimals.set(animal, howLongAsleep + 1);
                                    continue;
                                } else {
                                    sleepingAnimals.delete(animal);
                                }
                            }

                            if (direction && animal.energy >= MOVEMENT_COST + animal.age * 0.01) {
                                animal.lastAction = {
                                    move: direction,
                                };
                                animal.energy -= MOVEMENT_COST + animal.age * 0.01;
                                let { adjI, adjJ } = getAdjIndexes(direction, i, j);

                                if (contains(adjI, adjJ, GRID) && !cells.current[adjI][adjJ].animal) {
                                    cells.current[adjI][adjJ] = {
                                        animal: cell.animal,
                                        food: cells.current[adjI][adjJ].food,
                                    };
                                    cells.current[i][j] = {
                                        animal: null,
                                        food: cell.food,
                                    };
                                }
                            } else if (eat) {
                                animal.lastAction = {
                                    eat: true,
                                };
                                const currentCellFood = cells.current[i][j].food;
                                if (currentCellFood != null) {
                                    animal.energy += currentCellFood.value * 5; // food is (0,1)
                                    cells.current[i][j] = {
                                        animal: animal,
                                        food: null,
                                    };
                                }
                            } else if (sleep) {
                                animal.lastAction = {
                                    sleep: true,
                                };
                                sleepingAnimals.set(animal, 1);
                                animal.energy += SLEEPING_BONUS;
                            } else if (predate) {
                                animal.lastAction = {
                                    predate: true,
                                };
                                const dirs = getRandomDirections();
                                for (const dir of dirs) {
                                    let { adjI, adjJ } = getAdjIndexes(dir, i, j);
                                    if (contains(adjI, adjJ, GRID) && cells.current[adjI][adjJ].animal) {
                                        const preyEnergy = cells.current[adjI][adjJ].animal?.energy;
                                        if (preyEnergy != undefined) {
                                            // splitting this energy for the immediate killer
                                            // but also allowing some scavenging later!
                                            animal.energy += preyEnergy * 0.005;
                                        }
                                        cells.current[adjI][adjJ] = {
                                            animal: cell.animal,
                                            food: !cells.current[adjI][adjJ].food
                                                ? null
                                                : // scavenge
                                                  { value: cells.current[adjI][adjJ].food.value + preyEnergy * 0.005 },
                                        };
                                        cells.current[i][j] = {
                                            animal: null,
                                            food: cell.food,
                                        };
                                        break;
                                    }
                                }
                            } else if (reproduce && animal.energy >= REPRODUCTION_COST) {
                                animal.lastAction = {
                                    reproduce: true,
                                };
                                const dirs = getRandomDirections();
                                for (const dir of dirs) {
                                    let { adjI, adjJ } = getAdjIndexes(dir, i, j);
                                    if (contains(adjI, adjJ, GRID) && !cells.current[adjI][adjJ].animal) {
                                        animal.energy -= REPRODUCTION_COST;
                                        const newAnimal: Animal = {
                                            ...animal,
                                            energy: REPRODUCTION_COST,
                                            age: 0,
                                        };
                                        cells.current[adjI][adjJ] = {
                                            animal: newAnimal,
                                            food: cells.current[adjI][adjJ].food,
                                        };
                                        break;
                                    }
                                }
                            }
                        }

                        if (food == null && Math.random() < Math.max(0.05 / numTicks, 0.01)) {
                            cells.current[i][j].food = {
                                value: Math.random(),
                            };
                        }
                    }
                }
                vm?.dispose();
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
                const food = cell.food;
                if (food != null && animal == null) {
                    const scaledRGBFoodValue = food.value * 25;
                    ctx.fillStyle = `rgb(${scaledRGBFoodValue},${scaledRGBFoodValue},${scaledRGBFoodValue})`;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
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
        <>
            {!loading ? (
                <>
                    <Stage width={canvasSize} height={canvasSize} onMouseMove={(e) => handleHover(e)}>
                        <Layer ref={layerRef}>
                            <Shape width={canvasSize} height={canvasSize} sceneFunc={(ctx) => drawScene(ctx)} />
                        </Layer>
                    </Stage>
                    <div
                        className={`fixed top-1/2 -translate-y-1/2 -translate-x-1/2`}
                        style={{ left: `calc(50vw + ${canvasSize / 2}px + (50vw - ${canvasSize / 2}px) / 2)` }}
                    >
                        {hoveredCell != null && <AnimalInfo {...hoveredCell} />}
                    </div>
                </>
            ) : (
                <Spinner />
            )}
        </>
    );
}
