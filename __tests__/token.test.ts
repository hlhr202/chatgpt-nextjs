import { ChatGpt } from "@/lib/openai";
import { expect, test } from "vitest";
import type { ChatCompletionRequestMessage } from "openai";

const chatGpt = new ChatGpt();

const input: ChatCompletionRequestMessage[] = [
    {
        role: "system",
        content:
            "You are a helpful, pattern-following assistant that translates corporate jargon into plain English.",
    },
    {
        role: "system",
        name: "example_user",
        content: "New synergies will help drive top-line growth.",
    },
    {
        role: "system",
        name: "example_assistant",
        content: "Things working well together will increase revenue.",
    },
    {
        role: "system",
        name: "example_user",
        content:
            "Let's circle back when we have more bandwidth to touch base on opportunities for increased leverage.",
    },
    {
        role: "system",
        name: "example_assistant",
        content:
            "Let's talk later when we're less busy about how to do better.",
    },
    {
        role: "user",
        content:
            "This late pivot means we don't have time to boil the ocean for the client deliverable.",
    },
];

test("count token", () => {
    const messages = Array.from(input).reverse();
    expect(chatGpt.countToken(messages).numTokens).toEqual(126);
});

test("shorten history", () => {
    expect(chatGpt.shortenHistory(input, 6)).toEqual(input);
    expect(chatGpt.shortenHistory(input, 3)).toEqual(input.slice(3, 6));
});

test("send", async () => {
    const res = await chatGpt.sendMessage({
        message: { role: "user", content: "who are you" },
    });

    const unsub = res.subscribe((value) => {
        console.log(value);
    });

    await new Promise((res) => setTimeout(res, 5000));

    unsub.unsubscribe();
});
