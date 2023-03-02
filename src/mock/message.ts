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
            // text: `This is a damn long message that served for your debugging purposes\nTry it ${uuid()}`,
            text: "以下是一个简单的 JavaScript DFS（深度优先搜索）算法示例，用于遍历二叉树：\n\n```javascript\nfunction dfs(node) {\n  if (node !== null) {\n    console.log(node.value); // 访问当前节点\n    dfs(node.left); // 递归访问左子树\n    dfs(node.right); // 递归访问右子树\n  }\n}\n```\n其中 `node` 是二叉树的根节点，`value` 是节点的值。在这个示例中，我们首先访问当前节点，然后递归地访问左子树和右子树，直到遍历完整棵树。",
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
