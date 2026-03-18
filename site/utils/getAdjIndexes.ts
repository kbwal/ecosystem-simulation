export function getAdjIndexes(direction: "u" | "r" | "l" | "d", i: number, j: number) {
    let adjI = i;
    let adjJ = j;
    if (direction == "u") {
        adjI--;
    } else if (direction == "d") {
        adjI++;
    } else if (direction == "l") {
        adjJ--;
    } else if (direction == "r") {
        adjJ++;
    }

    return { adjI, adjJ };
}
