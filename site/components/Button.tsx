"use client";
import { trpc } from "../utils/trpc";
import { faker } from "@faker-js/faker";

export default function Button() {
    const createAnimal = trpc.createAnimal.useMutation({
        onError: () => {
            console.log("something went wrong, check your inputs!");
        },
    });

    // let randomColor = faker.color
    //     .rgb({ format: "decimal" })
    //     .reduce((acc, curr) => acc.toString() + curr.toString() + ",", "");
    // randomColor = randomColor.slice(0, -1);

    // let fakeScript = `function tick({
    //     energy,
    //     age,
    //     nearbyFood,
    //     nearbyAnimals,
    // }: {
    //     energy: number;
    //     age: number;
    //     nearbyFood: { distance: number; direction: "r" | "l" | "u" | "d" }[];
    //     nearbyAnimals: { distance: number; direction: "r" | "l" | "u" | "d" }[];
    // }) {
    //     if (energy < 10) {
    //         return {
    //             reproduce: true,
    //         };
    //     } else {
    //         return {
    //             move: "d",
    //         };
    //     }
    // }`;

    async function handleClick() {
        const animals = [
            {
                name: "Lion",
                author: "Marcus",
                color: "210,140,50",
                maxAge: 80,
                script: `function tick({
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
      if (nearbyAnimals.length > 0) {
        const closest = nearbyAnimals.reduce((a, b) => a.distance < b.distance ? a : b);
        return { predate: true, move: closest.direction };
      }
      if (energy < 20) {
        const food = nearbyFood[0];
        if (food) return { move: food.direction };
      }
      if (energy > 70 && age > 10) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Rabbit",
                author: "Sophie",
                color: "230,210,190",
                maxAge: 12,
                script: `function tick({
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
      const flee: Record<string, "r" | "l" | "u" | "d"> = { r: "l", l: "r", u: "d", d: "u" };
      if (nearbyAnimals.length > 0) {
        const threat = nearbyAnimals.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: flee[threat.direction] };
      }
      if (nearbyFood.length > 0) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: food.direction, eat: true };
      }
      if (energy > 50 && age > 2) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Tortoise",
                author: "Gerald",
                color: "100,195,110",
                maxAge: 99,
                script: `function tick({
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
      if (energy < 15) return { sleep: true };
      if (nearbyFood.length > 0) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        if (food.distance <= 1) return { eat: true };
        return { move: food.direction };
      }
      if (age > 40 && energy > 60) return { reproduce: true };
      return { sleep: true };
    }`,
            },

            {
                name: "Hummingbird",
                author: "Isla",
                color: "60,225,205",
                maxAge: 8,
                script: `function tick({
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
      if (energy < 30) {
        if (nearbyFood.length > 0) {
          const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
          return { move: food.direction, eat: true };
        }
        const dirs = ["r", "l", "u", "d"] as const;
        return { move: dirs[Math.floor(Math.random() * 4)] };
      }
      if (energy > 65 && age > 1) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Elephant",
                author: "Amara",
                color: "160,180,210",
                maxAge: 95,
                script: `function tick({
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
      if (nearbyFood.length > 0) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: food.direction, eat: true };
      }
      if (energy < 25) return { sleep: true };
      if (energy > 75 && age > 15) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Wolf",
                author: "Dmitri",
                color: "200,195,230",
                maxAge: 40,
                script: `function tick({
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
      if (energy < 10) return { sleep: true };
      if (nearbyAnimals.length > 0) {
        const prey = nearbyAnimals.reduce((a, b) => a.distance < b.distance ? a : b);
        if (prey.distance <= 2) return { predate: true };
        return { move: prey.direction };
      }
      if (nearbyFood.length > 0) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: food.direction, eat: true };
      }
      if (energy > 60 && age > 5) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Butterfly",
                author: "Lena",
                color: "215,110,240",
                maxAge: 5,
                script: `function tick({
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
      const flee: Record<string, "r" | "l" | "u" | "d"> = { r: "l", l: "r", u: "d", d: "u" };
      if (nearbyAnimals.length > 0) {
        const threat = nearbyAnimals.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: flee[threat.direction] };
      }
      if (nearbyFood.length > 0 && energy < 40) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: food.direction, eat: true };
      }
      if (age > 2 && energy > 45) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Whale",
                author: "Nils",
                color: "75,165,235",
                maxAge: 98,
                script: `function tick({
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
      if (energy < 20) return { sleep: true };
      if (nearbyFood.length > 0) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: food.direction, eat: true };
      }
      if (energy > 80 && age > 20) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Mouse",
                author: "Priya",
                color: "215,175,135",
                maxAge: 3,
                script: `function tick({
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
      const flee: Record<string, "r" | "l" | "u" | "d"> = { r: "l", l: "r", u: "d", d: "u" };
      if (nearbyAnimals.length > 0) {
        const threat = nearbyAnimals.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: flee[threat.direction] };
      }
      if (nearbyFood.length > 0) {
        const food = nearbyFood.reduce((a, b) => a.distance < b.distance ? a : b);
        return { move: food.direction, eat: true };
      }
      if (energy > 40 && age > 1) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },

            {
                name: "Crow",
                author: "Felix",
                color: "140,220,170",
                maxAge: 25,
                script: `function tick({
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
      if (nearbyFood.length > 0) {
        const sorted = [...nearbyFood].sort((a, b) => a.distance - b.distance);
        return { move: sorted[0].direction, eat: true };
      }
      if (nearbyAnimals.length > 0 && energy > 50) {
        const target = nearbyAnimals.reduce((a, b) => a.distance < b.distance ? a : b);
        return { predate: true, move: target.direction };
      }
      if (energy < 20) return { sleep: true };
      if (energy > 65 && age > 3) return { reproduce: true };
      const dirs = ["r", "l", "u", "d"] as const;
      return { move: dirs[Math.floor(Math.random() * 4)] };
    }`,
            },
        ];
        for (let i = 0; i < animals.length; i++) {
            const animal = animals[i];
            const response = await createAnimal.mutateAsync({
                name: animal.name,
                author: animal.author,
                color: animal.color,
                maxAge: animal.maxAge,
                script: animal.script,
            });
            if (response == null) {
                // handle this better later
                console.log("something went wrong with creating your animal...");
            }
        }
    }

    return (
        <button className="cursor-pointer" onClick={handleClick}>
            Add random animal for now
        </button>
    );
}
