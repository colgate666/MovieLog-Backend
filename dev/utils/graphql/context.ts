import { ApolloFastifyContextFunction } from "@as-integrations/fastify";
import { DB, MOVIEDB } from "../..";
import { DBDataSource } from "./data.sources/db.source";
import jwt from "jsonwebtoken";
import { Message } from "../types/message";
import { MovieDataSource } from "./data.sources/movie.source";

interface User {
    id: string;
    email: string;
    username: string;
}

export interface GraphQLContext {
    dataSources: {
        dbSource: DBDataSource;
        movieSource: MovieDataSource;
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
            movieSource: MOVIEDB,
        },
        user,
    }
};
