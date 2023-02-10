import { MessageResponse } from "@/interface/response";
import { ChatMessage } from "chatgpt";
import { v4 as uuid } from "uuid";

const createMessage = (): MessageResponse<ChatMessage> => {
    return {
        completed: true,
        data: {
            id: uuid(),
            parentMessageId: uuid(),
            conversationId: uuid(),
            text: `This is a damn long message that served for your debugging purposes\nTry it ${uuid()}`,
            role: "user",
        },
        send: "fuck",
    };
};

export const createMessages = (num = 20) => {
    const obj: Record<string, MessageResponse<ChatMessage>> = {};
    new Array(num)
        .fill(null)
        .map((_) => createMessage())
        .forEach((msg) => {
            obj[msg.data.id] = msg;
        });
    return obj;
};
