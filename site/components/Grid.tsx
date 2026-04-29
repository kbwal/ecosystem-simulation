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
import { Pause, Play } from "lucide-react";

export default function Grid({ cellSize = 3 }) {
    const [loading, setLoading] = useState(true);
    const [hoveredCell, setHoveredCell] = useState<Animal | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [msPerTick, setMsPerTick] = useState(500);
    const isPausedRef = useRef(isPaused);
    const msPerTickRef = useRef(msPerTick);

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

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        msPerTickRef.current = msPerTick;
    }, [msPerTick]);

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
        const sleepingAnimals = new WeakMap<object, number>();

        const tick = (timestamp: number) => {
            if (!cells.current) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            const animalPerformedActionThisTick = new Set();
            if (isPausedRef.current) {
                lastTime = timestamp;
                rafId = requestAnimationFrame(tick);
                return;
            }
            if (timestamp - lastTime >= msPerTickRef.current) {
                numTicks++;
                lastTime = timestamp;

                const vm = quickJSRef.current?.newContext();
                // 16 mb shared for the entire context
                // this should be recycled constantly though
                vm?.runtime.setMemoryLimit(2 ** 10 * 2 ** 10 * 16);

                const sampledIndexes = Array.from({ length: GRID * GRID }, (_, index) => index);
                for (let i = sampledIndexes.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [sampledIndexes[i], sampledIndexes[j]] = [sampledIndexes[j], sampledIndexes[i]];
                }

                for (const sampledIndex of sampledIndexes) {
                    const i = Math.floor(sampledIndex / GRID);
                    const j = sampledIndex % GRID;
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
                            const { adjI, adjJ } = getAdjIndexes(direction, i, j);

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
                                const { adjI, adjJ } = getAdjIndexes(dir, i, j);
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
                                            ? { value: preyEnergy * 0.005 }
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
                                const { adjI, adjJ } = getAdjIndexes(dir, i, j);
                                if (contains(adjI, adjJ, GRID) && !cells.current[adjI][adjJ].animal) {
                                    animal.energy -= REPRODUCTION_COST;
                                    const newAnimal: Animal = {
                                        ...animal,
                                        energy: REPRODUCTION_COST,
                                        age: 0,
                                    };
                                    animalPerformedActionThisTick.add(newAnimal);
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
                    if (animal.lastAction?.predate) {
                        ctx.strokeStyle = "rgb(255,0,0)";
                        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                    if (animal.lastAction?.reproduce) {
                        ctx.strokeStyle = "rgb(0,0,255)";
                        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
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
                    <div className="flex flex-col items-center">
                        <Stage width={canvasSize} height={canvasSize} onMouseMove={(e) => handleHover(e)}>
                            <Layer ref={layerRef}>
                                <Shape width={canvasSize} height={canvasSize} sceneFunc={(ctx) => drawScene(ctx)} />
                            </Layer>
                        </Stage>
                        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex w-full max-w-[min(90vw,500px)] items-center gap-4 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-zinc-300 shadow-lg shadow-black/30 backdrop-blur-sm">
                            <button
                                type="button"
                                onClick={() => setIsPaused((paused) => !paused)}
                                className="cursor-pointer inline-flex h-9 w-24 items-center justify-center gap-2 rounded-full border border-zinc-700 bg-black/40 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                                aria-label={isPaused ? "Play simulation" : "Pause simulation"}
                            >
                                {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
                                {isPaused ? "Play" : "Pause"}
                            </button>
                            <label className="flex flex-1 items-center gap-3 text-sm">
                                <span className="whitespace-nowrap text-zinc-400">Speed</span>
                                <input
                                    type="range"
                                    min="50"
                                    max="1000"
                                    step="50"
                                    value={msPerTick}
                                    onChange={(e) => setMsPerTick(Number(e.target.value))}
                                    className="h-2 flex-1 cursor-pointer accent-zinc-200"
                                    aria-label="Milliseconds per tick"
                                />
                                <span className="w-14 font-mono text-xs text-zinc-400">{msPerTick}ms</span>
                            </label>
                        </div>
                    </div>
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
