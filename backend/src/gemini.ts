import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const returnSchema = z.object({
    isValid: z.boolean(),
});

export async function askGemini(prompt: string) {
    let response;
    try {
        response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
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
