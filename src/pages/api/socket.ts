// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Server } from "socket.io";
import { Server as NetServer } from "http";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "@/lib/chatgpt";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const server = (res.socket as any)?.server as NetServer;

    if (!(server as any).io) {
        const io = new Server(server);
        io.on("connection", (socket) => {
            socket.on("message", async (payload) => {
                const { message, conversationId, parentMessageId } = payload;
                const response = await api.sendMessage(message, {
                    conversationId,
                    parentMessageId,
                    onProgress(partialResponse) {
                        const returnMessage = {
                            completed: false,
                            data: partialResponse,
                            send: message,
                        };
                        socket.send(returnMessage);
                    },
                });

                socket.send({ completed: true, data: response, send: message });
            });
        });
        (server as any).io = io;
    }

    res.end();
}
