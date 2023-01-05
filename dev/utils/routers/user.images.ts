import { FastifyPluginAsync } from "fastify";
import path from "path";
import { send } from "process";
import { DB } from "../..";
import { verifyToken } from "../token.verify";
import { User } from "../types/db.types/user";
import { Message } from "../types/message";

export const avatarRouter: FastifyPluginAsync = async (instance) => {
    instance.get("/avatar", { preHandler: verifyToken }, async (request, reply) => {
        const response = await DB.getUserById(request.user!);
        const isMessage = await Message.spa(response);

        if (isMessage.success) {
            return await reply.status(isMessage.data.code).send(isMessage.data);
        }

        const usr = response as User;
        
        if (!usr.avatar) {
            return await reply.code(404).send("Avatar not found for this user.");
        }

        return await reply.sendFile(path.join("images", "avatars", usr.avatar));
    });

    instance.get("/:userId/avatar", async (request, reply) => {
        const { userId } = request.params as { userId: string };

        const response = await DB.getUserById(userId);
        const isMessage = await Message.spa(response);

        if (isMessage.success) {
            return await reply.status(isMessage.data.code).send(isMessage.data);
        }

        const usr = response as User;

        if (!usr.avatar) {
            return await reply.code(404).send("Avatar not found for this user.");
        }

        return await reply.sendFile(path.join("images", "avatars", usr.avatar));
    });
}