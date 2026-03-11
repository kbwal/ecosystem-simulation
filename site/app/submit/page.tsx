"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submissionSchema, submissionSchemaType } from "@/utils/submissionSchemas";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";

export default function Submit() {
    const router = useRouter();
    const createAnimal = trpc.createAnimal.useMutation({
        onError: () => {
            console.log("something went wrong, check your inputs!");
            return false;
        },
    });

    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [color, setColor] = useState("");
    const [maxAge, setMaxAge] = useState<number | undefined>(undefined);
    const [script, setScript] = useState("");
    const [error, setError] = useState(false);

    async function handleSubmission(inputs: submissionSchemaType) {
        try {
            submissionSchema.parse(inputs);
        } catch (e) {
            console.log("something was wrong in the submission");
            return false;
        }

        const response = await createAnimal.mutateAsync({
            name: inputs.name,
            author: inputs.author,
            color: inputs.color,
            maxAge: inputs.maxAge,
            script: inputs.script,
        });
        if (response == null) {
            // handle this better later
            console.log("something went wrong with creating your animal...");
            return false;
        }
        return true;
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-7 bg-zinc-50 font-sans dark:bg-black">
            <FieldSet className="w-full max-w-xl">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="name">Animal Name</FieldLabel>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Elephants"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="author">Your Name (feel free to stay anon)</FieldLabel>
                        <Input
                            id="author"
                            type="text"
                            placeholder="Mia"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="color">
                            What
                            <span
                                style={
                                    { "--selected-color": color ? `rgb(${color})` : "currentColor" } as React.CSSProperties
                                }
                                className="text-(--selected-color) font-bold ml-1"
                            >
                                color
                            </span>
                            do you want? (3 numbers, comma separated, no spaces please!)
                        </FieldLabel>
                        <Input
                            id="color"
                            type="text"
                            placeholder="255,255,0"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="maxAge">What age should your animal die?</FieldLabel>
                        <Input
                            id="maxAge"
                            type="number"
                            placeholder="22"
                            value={maxAge ?? ""}
                            onChange={(e) => {
                                const parsed = parseInt(e.target.value);
                                setMaxAge(isNaN(parsed) ? undefined : parsed);
                            }}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="script">TypeScript code here</FieldLabel>
                        <Textarea
                            id="script"
                            placeholder="Paste script here"
                            rows={4}
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                        />
                        <FieldDescription>
                            The script should have one function called tick() that takes a parameter of {"{"}
                            energy: number; age: number; nearbyFood:{" "}
                            {'{ distance: number; direction: "r" | "l" | "u" | "d" }[];'}
                            nearbyAnimals: {'{ distance: number; direction: "r" | "l" | "u" | "d" }[];'}
                            {"}"}
                            <br />
                            It should return an object of type {"{"}move?: "r" | "l" | "u" | "d"; eat?: boolean; reproduce?:
                            boolean; sleep?: boolean; predate?: boolean;{"}"}
                            <br />
                            Please don't import any libraries or try breaking my server :)
                            <br />
                            If this form errors randomly, Gemini is calling your code malicious
                        </FieldDescription>
                    </Field>
                    <Button
                        className={`cursor-pointer ${!error ? "bg-zinc-900" : "bg-red-500"} min-h-10`}
                        onClick={async () => {
                            if (maxAge == undefined) {
                                console.log("maxAge is undefined!");
                                setError(true);
                                await new Promise((resolve) => setTimeout(resolve, 1000));
                                setError(false);
                            } else {
                                const result = await handleSubmission({
                                    name: name,
                                    author: author,
                                    color: color,
                                    maxAge: maxAge,
                                    script: script,
                                });
                                if (!result) {
                                    setError(true);
                                    await new Promise((resolve) => setTimeout(resolve, 1500));
                                    setError(false);
                                } else {
                                    router.push("/");
                                }
                            }
                        }}
                    >
                        {!error ? "Submit Animal" : "Error"}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </div>
    );
}
