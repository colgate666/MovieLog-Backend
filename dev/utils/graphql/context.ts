import { ApolloFastifyContextFunction } from "@as-integrations/fastify";
import { DB, LOG } from "../..";
import { DBDataSource } from "./data.sources/db.source";

interface User {
    id: String;
    email: String;
    username: String;
}

export interface GraphQLContext {
    dataSources: {
        dbSource: DBDataSource;
    };
    user: User;
}


export const context: ApolloFastifyContextFunction<GraphQLContext> = async request => {
    LOG.info(request.headers);
    return {
        dataSources: {
            dbSource: DB,
        },
        user: {
            email: "asd",
            id: "asd",
            username: "asdasd"
        }
    }
};
