// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { MessageResponse } from "@/interface/response";
import { api } from "@/lib/chatgpt";
import type { ChatMessage } from "chatgpt";
import type { NextApiRequest, NextApiResponse } from "next";
import { Base64 } from "js-base64";
import jwt from "jsonwebtoken";
// import { openai } from "@/lib/openai";

export const config = {
    runtime: "nodejs",
};

export const runtime = "nodejs";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MessageResponse<ChatMessage> | { code: string }>
) {
    const token = req.cookies["Auth"];

    try {
        const valid = jwt.verify(token ?? "", process.env.secret as string);
        const { message, parentMessageId } = JSON.parse(req.body);

        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Content-Type", "text/plain");

        // openai.createChatCompletion({
        //     model: "gpt-3.5-turbo",
        //     messages: [{ role: "user", content: message }],
        // });

        const response = await api.sendMessage(message, {
            parentMessageId,
            stream: true,
            onProgress(partialResponse) {
                res.write(
                    Base64.encode(
                        JSON.stringify({
                            completed: false,
                            data: partialResponse,
                            send: message,
                        })
                    ) + "."
                );
            },
        });

        res.write(
            Base64.encode(
                JSON.stringify({
                    completed: true,
                    data: response,
                    send: message,
                })
            )
        );
        res.end();
    } catch {
        res.status(403).json({ code: "UNAUTHORISED" });
    }
}
