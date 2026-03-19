import { db } from "./db";
import { animals } from "./schema";

// these animals are gemini-3.1-pro-preview generated
// they look pretty good
const initialAnimals = [
    {
        name: "Grazer",
        author: "System",
        color: "100,200,100", // Greenish
        maxAge: 400,
        script: `function tick(state) {
    if (state.energy > 80) return { reproduce: true };
    if (state.energy < 20) return { sleep: true };
    
    const foodOnMe = state.nearbyFood.find(f => f.deltaX === 0 && f.deltaY === 0);
    if (foodOnMe) return { eat: true };
    
    let closestFood = null;
    let minD = Infinity;
    for (let f of state.nearbyFood) {
        let d = Math.abs(f.deltaX) + Math.abs(f.deltaY);
        if (d < minD) { minD = d; closestFood = f; }
    }
    if (closestFood) {
        if (Math.abs(closestFood.deltaX) > Math.abs(closestFood.deltaY)) {
            return { move: closestFood.deltaX > 0 ? "r" : "l" };
        } else {
            return { move: closestFood.deltaY > 0 ? "d" : "u" };
        }
    }
    const dirs = ["r", "l", "u", "d"];
    return { move: dirs[Math.floor(Math.random() * 4)] };
}`,
    },
    {
        name: "Predator",
        author: "System",
        color: "200,50,50", // Red
        maxAge: 300,
        script: `function tick(state) {
    if (state.energy > 120) return { reproduce: true };
    if (state.energy < 30) return { sleep: true };
    
    let adjacentPrey = state.nearbyAnimals.find(a => Math.abs(a.deltaX) + Math.abs(a.deltaY) === 1);
    if (adjacentPrey) return { predate: true };
    
    let closestPrey = null;
    let minD = Infinity;
    for (let a of state.nearbyAnimals) {
        let d = Math.abs(a.deltaX) + Math.abs(a.deltaY);
        if (d < minD) { minD = d; closestPrey = a; }
    }
    if (closestPrey) {
        if (Math.abs(closestPrey.deltaX) > Math.abs(closestPrey.deltaY)) {
            return { move: closestPrey.deltaX > 0 ? "r" : "l" };
        } else {
            return { move: closestPrey.deltaY > 0 ? "d" : "u" };
        }
    }
    const dirs = ["r", "l", "u", "d"];
    return { move: dirs[Math.floor(Math.random() * 4)] };
}`,
    },
    {
        name: "Plant",
        author: "System",
        color: "30,120,30", // Dark Green
        maxAge: 600,
        script: `function tick(state) {
    if (state.energy > 150) return { reproduce: true };
    return { sleep: true };
}`,
    },
    {
        name: "Ambush Spider",
        author: "System",
        color: "100,100,100", // Grey
        maxAge: 450,
        script: `function tick(state) {
    if (state.energy > 100) return { reproduce: true };
    let adjacentPrey = state.nearbyAnimals.find(a => Math.abs(a.deltaX) + Math.abs(a.deltaY) === 1);
    if (adjacentPrey) return { predate: true };
    return { sleep: true };
}`,
    },
    {
        name: "Cowardly Scavenger",
        author: "System",
        color: "180,180,50", // Yellowish
        maxAge: 250,
        script: `function tick(state) {
    if (state.energy > 70) return { reproduce: true };
    
    // Flee from animals
    let closestAnimal = null;
    let minAnimalD = Infinity;
    for (let a of state.nearbyAnimals) {
        let d = Math.abs(a.deltaX) + Math.abs(a.deltaY);
        if (d < minAnimalD) { minAnimalD = d; closestAnimal = a; }
    }
    if (closestAnimal && minAnimalD < 3) {
        if (Math.abs(closestAnimal.deltaX) > Math.abs(closestAnimal.deltaY)) {
            return { move: closestAnimal.deltaX > 0 ? "l" : "r" }; // move away
        } else {
            return { move: closestAnimal.deltaY > 0 ? "u" : "d" }; // move away
        }
    }
    
    const foodOnMe = state.nearbyFood.find(f => f.deltaX === 0 && f.deltaY === 0);
    if (foodOnMe) return { eat: true };
    
    let closestFood = null;
    let minD = Infinity;
    for (let f of state.nearbyFood) {
        let d = Math.abs(f.deltaX) + Math.abs(f.deltaY);
        if (d < minD) { minD = d; closestFood = f; }
    }
    if (closestFood) {
        if (Math.abs(closestFood.deltaX) > Math.abs(closestFood.deltaY)) {
            return { move: closestFood.deltaX > 0 ? "r" : "l" };
        } else {
            return { move: closestFood.deltaY > 0 ? "d" : "u" };
        }
    }
    const dirs = ["r", "l", "u", "d"];
    return { move: dirs[Math.floor(Math.random() * 4)] };
}`,
    },
    {
        name: "ZigZag Tracker",
        author: "System",
        color: "200,100,200", // Pink/Purple
        maxAge: 350,
        script: `function tick(state) {
    if (state.energy > 90) return { reproduce: true };
    if (state.energy < 15) return { sleep: true };
    
    let adjacentPrey = state.nearbyAnimals.find(a => Math.abs(a.deltaX) + Math.abs(a.deltaY) === 1);
    if (adjacentPrey) return { predate: true };
    
    // Zig-zag movement pattern utilizing absolute grid coordinates
    if ((state.position.x + state.position.y) % 2 === 0) {
        return { move: "r" };
    } else {
        return { move: "d" };
    }
}`,
    },
    {
        name: "Swarm Bee",
        author: "System",
        color: "255,200,0", // Gold/Yellow
        maxAge: 200,
        script: `function tick(state) {
    if (state.energy > 60) return { reproduce: true };
    
    const foodOnMe = state.nearbyFood.find(f => f.deltaX === 0 && f.deltaY === 0);
    if (foodOnMe) return { eat: true };
    
    // Move towards friends to swarm
    let closestFriend = null;
    let minD = Infinity;
    for (let a of state.nearbyAnimals) {
        if (a.name === "Swarm Bee") {
            let d = Math.abs(a.deltaX) + Math.abs(a.deltaY);
            if (d < minD && d > 1) { minD = d; closestFriend = a; }
        }
    }
    
    if (closestFriend) {
        if (Math.abs(closestFriend.deltaX) > Math.abs(closestFriend.deltaY)) {
            return { move: closestFriend.deltaX > 0 ? "r" : "l" };
        } else {
            return { move: closestFriend.deltaY > 0 ? "d" : "u" };
        }
    }
    
    let closestFood = null;
    minD = Infinity;
    for (let f of state.nearbyFood) {
        let d = Math.abs(f.deltaX) + Math.abs(f.deltaY);
        if (d < minD) { minD = d; closestFood = f; }
    }
    if (closestFood) {
        if (Math.abs(closestFood.deltaX) > Math.abs(closestFood.deltaY)) {
            return { move: closestFood.deltaX > 0 ? "r" : "l" };
        } else {
            return { move: closestFood.deltaY > 0 ? "d" : "u" };
        }
    }
    
    const dirs = ["r", "l", "u", "d"];
    return { move: dirs[Math.floor(Math.random() * 4)] };
}`,
    },
];

export async function seedDatabase() {
    await db.delete(animals);
    await db.insert(animals).values(initialAnimals);
    console.log("done seeding the database");
}
