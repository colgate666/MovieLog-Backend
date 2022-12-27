import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import jwt from "jsonwebtoken";
import { LOG } from "..";

export const verifyToken = async (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    try {
        LOG.info(request.headers);

        if (!request.headers.authorization) {
            return await reply.code(401).send({ message: "Auth token missing" });
        }

        const id = jwt.decode(request.headers.authorization!) as string;

        request.user = id;
    } catch (err) {
        LOG.error(err);
        return await reply.code(500).send({ message: "Couldn't retrieve image" });
    }
}