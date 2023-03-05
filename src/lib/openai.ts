import {
    OpenAIApi,
    Configuration,
    type ChatCompletionRequestMessage,
    type CreateChatCompletionResponse,
} from "openai";
import { get_encoding, type TiktokenEmbedding } from "@dqbd/tiktoken";
import Keyv from "keyv";
import QuickLRU from "quick-lru";
import { v4 as uuidv4 } from "uuid";
import type { IncomingMessage } from "http";
import { Subject } from "rxjs";
import { createParser } from "eventsource-parser";

const configuration = new Configuration({
    apiKey: process.env.apiKey as string,
});

interface ChatResponse extends CreateChatCompletionResponse {
    conversationId?: string;
}

export class ChatGpt {
    maxHistoryPerConversation = 100;
    maxConversations = 100;
    maxRequestToken = 1000;

    store = new Keyv<ChatCompletionRequestMessage[], any>({
        store: new QuickLRU<string, ChatCompletionRequestMessage[]>({
            maxSize: this.maxConversations,
        }),
    });

    openai = new OpenAIApi(configuration);

    constructor() {}

    /**
     * Count history tokens by tiktoken
     * @param messages Completion messages from history
     * @param stopWhenReachMaxReqToken Stop when max request token reached
     * @param maxReqToken Maximum request token, default 1000
     * @param encoding TikToken embedding algorithm
     * @returns Number of tokens and stopped index
     */
    countToken = (
        messages: ChatCompletionRequestMessage[],
        stopWhenReachMaxReqToken = false,
        maxReqToken = this.maxRequestToken,
        encoding: TiktokenEmbedding = "cl100k_base"
    ) => {
        let numTokens = 0;
        let stoppedOffset = messages.length - 1;
        const encoder = get_encoding(encoding);
        for (const [index, message] of messages.entries()) {
            numTokens += 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n
            for (const [key, value] of Object.entries(message)) {
                numTokens += encoder.encode(value).length;
                if (key === "name") {
                    // if there's a name, the role is omitted
                    // role is always required and always 1 token
                    numTokens += -1;
                }
            }

            if (stopWhenReachMaxReqToken && numTokens + 2 > maxReqToken) {
                stoppedOffset = index;
                break;
            }
        }

        numTokens += 2; // every reply is primed with <im_start>assistant
        return { numTokens, stoppedOffset };
    };

    /**
     * To slice messages to fit the max request token and keep contextual information
     * @param messages Completion messages from history
     * @param maxReqToken Maximum request token, default 1000
     * @returns Contextual messages
     */
    sliceMessagesInContextual = (
        messages: ChatCompletionRequestMessage[],
        maxReqToken = this.maxRequestToken
    ) => {
        const reversedInput = Array.from(messages).reverse();
        const { stoppedOffset } = this.countToken(
            reversedInput,
            true,
            maxReqToken
        );
        return reversedInput.slice(0, stoppedOffset).reverse();
    };

    /**
     * Always keep last number of conversation history
     * @param history Message history
     * @param maxHistoryLength Maximum history length per conversation, default 100
     * @returns Last number of conversation history
     */
    shortenHistory = (
        history: ChatCompletionRequestMessage[],
        maxHistoryLength = this.maxHistoryPerConversation
    ) => {
        if (maxHistoryLength >= history.length) {
            return history;
        } else {
            return history.slice(
                history.length - maxHistoryLength,
                history.length
            );
        }
    };

    /**
     * Send message and get an Observable of OpenAI's SSE
     * @param param0
     * @returns
     */
    sendMessage = async ({
        conversationId,
        message,
    }: {
        conversationId?: string;
        message: ChatCompletionRequestMessage;
    }) => {
        let history = conversationId
            ? await this.store.get(conversationId)
            : undefined;

        if (!conversationId) {
            conversationId = uuidv4();
        }

        let contextualMessages: ChatCompletionRequestMessage[] = [];

        if (history && history.length) {
            history.push(message);
            history = this.shortenHistory(history);
            contextualMessages = this.sliceMessagesInContextual(history);
        } else {
            history = [message];
            contextualMessages = history;
        }

        this.store.set(conversationId, history);

        const res = await this.openai.createChatCompletion(
            {
                model: "gpt-3.5-turbo",
                messages: contextualMessages,
                stream: true,
            },
            { responseType: "stream" }
        );

        const stream = res.data as unknown as IncomingMessage;

        const $sub = new Subject<ChatResponse>();

        const parser = createParser((event) => {
            if (event.type === "event") {
                const value = event.data;
                if (value !== "[DONE]") {
                    try {
                        const data = JSON.parse(
                            value
                        ) as CreateChatCompletionResponse;
                        $sub.next(Object.assign({}, data, { conversationId }));
                    } catch {
                        $sub.error("Not Parsable");
                    }
                } else {
                    $sub.complete();
                }
            } else if (event.type === "reconnect-interval") {
                console.log(
                    "We should set reconnect interval to %d milliseconds",
                    event.value
                );
            }
        });

        stream.on("data", (data) => {
            parser.feed(new TextDecoder().decode(data));
        });

        return $sub.asObservable();
    };
}
