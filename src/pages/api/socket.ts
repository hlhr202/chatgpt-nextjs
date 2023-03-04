// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Server } from "socket.io";
import { Server as NetServer } from "http";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "@/lib/chatgpt";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const token = req.cookies["Auth"];

    try {
        const valid = jwt.verify(token ?? "", process.env.secret as string);
        const server = (res.socket as any)?.server as NetServer;

        if (!(server as any).io) {
            const io = new Server(server);
            io.on("connection", (socket) => {
                socket.on("message", async (payload) => {
                    const { message, parentMessageId } = payload;
                    const response = await api.sendMessage(message, {
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

                    socket.send({
                        completed: true,
                        data: response,
                        send: message,
                    });
                });
            });
            (server as any).io = io;
        }

        res.status(200).json({ code: "SUCCESS" });
    } catch {
        res.status(403).json({ code: "UNAUTHORISED" });
    }
}
