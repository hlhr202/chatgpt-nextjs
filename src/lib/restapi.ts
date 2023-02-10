import { MessageResponse } from "@/interface/response";
import { ChatMessage } from "chatgpt";
import { Base64 } from "js-base64";
import { from, map, ReadableStreamLike, switchMap } from "rxjs";
import { fromFetch } from "rxjs/fetch";

export const useRestApi = () => {
    const handleSend = (payload: {
        parentMessageId?: string;
        conversationId?: string;
        message: string;
    }) => {
        const obs = fromFetch("/api/send", {
            method: "POST",
            body: JSON.stringify(payload),
        })
            .pipe(
                switchMap((response) =>
                    from(response.body! as ReadableStreamLike<Uint8Array>).pipe(
                        map((str) => new TextDecoder().decode(str))
                    )
                )
            )
            .pipe(
                map((str) => {
                    return str
                        .split(".")
                        .filter((_) => _ !== "")
                        .map((v) => {
                            const value = Base64.decode(v);
                            const response: MessageResponse<ChatMessage> =
                                JSON.parse(value);
                            return response;
                        });
                })
            );

        return obs;
    };

    return handleSend;
};
