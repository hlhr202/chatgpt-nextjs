import { OpenAIApi, Configuration } from "openai";

const configuration = new Configuration({
    apiKey: process.env.apiKey as string,
});

export const openai = new OpenAIApi(configuration);
