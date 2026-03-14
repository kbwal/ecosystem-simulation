import { Animal } from "@/types/animalTypes";

export default function AnimalInfo(animal: Animal) {
    return (
        <>
            <p style={{ color: `rgb(${animal.color})` }}>{animal.name}</p>
            <p>It has: {Math.floor(animal.energy)} energy</p>
            <p>And is {animal.age} years old</p>
            <p>Made by {animal.author}</p>
        </>
    );
}
