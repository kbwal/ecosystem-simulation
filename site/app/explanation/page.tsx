export default function Explanation() {
    return (
        <div className="flex min-h-screen items-center justify-center p-7 bg-black font-sans">
            <p>
                This is an ecosystem simulation of animals! <br />
                Each species of animal gets its own color and its own script (i.e. how it chooses to eat, reproduce, move,
                etc) <br />
                Each species of animal can use information from a few factors (such as their age, energy, nearby food, etc)
                to make decisions about what action to take
                <br />
                Feel free to make your own animal{" "}
                <a className="text-blue-400" href="/submit">
                    here.
                </a>
                <br />
                You do currently need to program your own script in TypeScript, but for sufficiently simple scripts you can
                probably get an LLM to make what you want
                <br />
                Each frame, the cells update to reflect the animal's actions
                <br />
                The code is{" "}
                <a className="text-blue-400" href="https://github.com/kbwal/ecosystem-simulation" target="_blank">
                    open-source
                </a>
                , feel free to contribute!
            </p>
        </div>
    );
}
