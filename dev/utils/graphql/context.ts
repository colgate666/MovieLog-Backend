import { ApolloFastifyContextFunction } from "@as-integrations/fastify";
import { DB, LOG } from "../..";
import { DBDataSource } from "./data.sources/db.source";
import jwt from "jsonwebtoken";
import { Message } from "../types/message";

interface User {
    id: String;
    email: String;
    username: String;
}

export interface GraphQLContext {
    dataSources: {
        dbSource: DBDataSource;
    };
    user?: User;
}


export const context: ApolloFastifyContextFunction<GraphQLContext> = async request => {
    let user: User | undefined;
    const authHeader = request.headers.authorization;

    if (authHeader) {
        const payload = jwt.decode(authHeader) as string;
        const result = await DB.getUserById(payload);
        const isMessage = await Message.spa(result);

        if (!isMessage.success) {
            user = result as User;
        }
    }

    return {
        dataSources: {
            dbSource: DB,
        },
        user,
    }
};
