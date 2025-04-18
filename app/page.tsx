"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { readStreamableValue } from "ai/rsc";
import { generate } from "./action";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FormSchema = z.object({
  vocab: z.string().min(2, {
    message: "Vocabulary must be at least 2 characters.",
  }),
  instruction: z.string().min(10, {
    message: "Instruction must be at least 10 characters.",
  }),
  language: z.string().min(2, {
    message: "Language must be at least 2 characters.",
  }),
});

export default function Home() {
  const router = useRouter();

  const [generation, setGeneration] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vocab: "sleep, eat",
      instruction:
        "Create one short reading passage with two paragraphs for primary 1 students",
      language: "english",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    const { output } = await generate(data);

    for await (const delta of readStreamableValue(output)) {
      setGeneration((currentGeneration) => `${currentGeneration}${delta}`);
    }
    setIsSubmitting(false);
  }

  function save() {
    console.log(generation);
    let result = generation
      .split("**Passage:**")
      .pop()
      ?.replace("**Vocabulary words:**", "**Vocabulary Words:**");
    let passage = result?.split("**Vocabulary Words:**")[0];
    let definitions = result
      ?.split("**Vocabulary Words:**")[1]
      ?.split("Note:")[0];

    const params = {
      userId: 1,
      passage,
      definitions,
    };
    console.log(params);
  }

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-y-6">
      {generation.includes("**Passage:**") ? ( //  generation.includes("**Passage:**")
        <div className="w-full h-full flex flex-col justify-start items-center pt-8 gap-y-6">
          <div className="w-full mb-12 flex justify-center items-center border-[0.5px] border-gray-200 bg-gray-100">
            <div className="md:w-2/3 w-full flex justify-between py-2 ">
              <Button
                className="bg-gray-200 text-black hover:bg-gray-300 p-3 gap-x-1"
                onClick={() => {
                  setGeneration("");
                  router.refresh();
                }}
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              <Button
                className="bg-lime-400 text-black hover:bg-lime-300 p-3"
                onClick={save}
                disabled={isSubmitting ? true : false}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="md:w-2/3 w-full text-sm border-[1px] border-gray-200 rounded-xl">
            <div className="bg-gray-100 text-black rounded-t-xl px-3 py-2">
              <p>Passage</p>
            </div>
            <div className="px-3 py-5">
              <ReactMarkdown>
                {
                  generation
                    .split("**Passage:**")
                    .pop()
                    ?.replace("**Vocabulary words:**", "**Vocabulary Words:**")
                    ?.split("**Vocabulary Words:**")[0]
                }
              </ReactMarkdown>
            </div>
          </div>

          <div className="md:w-2/3 w-full text-sm border-[1px] border-gray-200 rounded-xl">
            <div className="bg-gray-100 text-black rounded-t-xl px-3 py-2">
              <p>Vocabulary Words</p>
            </div>
            <div className="px-3 py-5">
              <ReactMarkdown>
                {
                  generation
                    .split("**Passage:**")
                    .pop()
                    ?.replace("**Vocabulary words:**", "**Vocabulary Words:**")
                    ?.split("**Vocabulary Words:**")[1]
                    ?.split("Note:")[0]
                }
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex w-full flex-col text-center justify-center items-center gap-y-3 mb-5">
            <h1 className="text-2xl font-semibold">
              Create a vocabulary based reading
            </h1>
            <h3 className="text-gray-500 font-base text-lg">
              Create a reading passage based on vocabulary words
            </h3>
          </div>
          <div className="w-full flex justify-center items-center">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-2/3 space-y-6"
              >
                <FormField
                  control={form.control}
                  name="vocab"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vocabulary words</FormLabel>
                      <FormControl>
                        <Input placeholder="talk, walk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instruction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional instructions (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Create one short reading passage with two paragraphs for primary 1 students"
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Output language</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="English" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="vietnamese">
                                Vietnamese
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="bg-lime-400 hover:bg-lime-200 w-full text-black gap-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-spin"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Generate Reading Passage
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </>
      )}
    </div>
  );
}
