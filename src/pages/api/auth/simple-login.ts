// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { password } = JSON.parse(req.body);
    if (password === process.env.password) {
        const token = jwt.sign(
            {
                id: "-1",
            },
            process.env.secret as string,
            {
                expiresIn: "30d",
            }
        );
        res.setHeader(
            "Set-Cookie",
            `Auth=${token}; Max-Age=2592000; HttpOnly; Path=/`
        );
        res.status(200).json({ code: "SUCCESS" });
    } else {
        res.status(403).json({
            code: "UNAUTHORISED",
            message: "password not valid",
        });
    }
}
