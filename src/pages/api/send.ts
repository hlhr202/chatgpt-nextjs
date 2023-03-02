// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { MessageResponse } from "@/interface/response";
import { api } from "@/lib/chatgpt";
import type { ChatMessage } from "chatgpt";
import type { NextApiRequest, NextApiResponse } from "next";
import { Base64 } from "js-base64";

export const config = {
    runtime: "nodejs",
};

export const runtime = "nodejs";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MessageResponse<ChatMessage>>
) {
    const { message, parentMessageId } = JSON.parse(req.body);

    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Content-Type", "text/plain");

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
            JSON.stringify({ completed: true, data: response, send: message })
        )
    );
    res.end();
}
