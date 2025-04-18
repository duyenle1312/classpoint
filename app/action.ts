"use server";

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";


const FormSchema = z.object({
  vocab: z.string().min(2),
  instruction: z.string().min(10),
  language: z.string().min(2),
});

export async function generate(input: z.infer<typeof FormSchema>) {
  "use server";
  const { vocab, instruction, language } = input;
  console.log("Server received: ", input)

  const stream = createStreamableValue("");

  (async () => {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });

    const { textStream } = await streamText({
      model: groq("llama3-8b-8192"),
      prompt:
        `${instruction}, including vocabulary words: ${vocab} and the definitions and type in ${language}`,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
