export function getRandomDirections() {
    const randomDirs: ("r" | "l" | "u" | "d")[] = ["u", "d", "l", "r"];
    for (let i = randomDirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomDirs[i], randomDirs[j]] = [randomDirs[j], randomDirs[i]];
    }
    return randomDirs;
}
