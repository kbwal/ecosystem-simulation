import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";

const returnSchema = z.object({
    isValid: z.boolean(),
});

function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleGenAI({ apiKey });
}

export async function askGemini(prompt: string) {
    let response;
    try {
        const ai = getAI();
        response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
                responseJsonSchema: z.toJSONSchema(returnSchema),
                responseMimeType: "application/json",
                thinkingConfig: {
                    thinkingLevel: ThinkingLevel.HIGH,
                },
            },
        });
    } catch (error) {
        return null;
    }

    let parsedResponse = {
        isValid: false,
    };

    if (response.text == undefined) {
        return null;
    }

    try {
        parsedResponse = returnSchema.parse(JSON.parse(response.text));
    } catch (error) {
        return null;
    }

    return parsedResponse;
}
