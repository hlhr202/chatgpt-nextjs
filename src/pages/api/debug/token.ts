// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ChatGpt } from "@/lib/openai";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { messages } = JSON.parse(req.body);
    new ChatGpt().countToken(messages);
    res.status(200).json({ name: "John Doe" });
}
