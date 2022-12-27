import dotenv from "dotenv";
import "reflect-metadata";
import fastify from "fastify";
import { ApolloServer } from "@apollo/server";
import fastifyApollo, { fastifyApolloDrainPlugin } from "@as-integrations/fastify";
import { 
    ApolloServerPluginLandingPageLocalDefault, 
    ApolloServerPluginLandingPageProductionDefault 
} from '@apollo/server/plugin/landingPage/default';
import { context, GraphQLContext } from "./utils/graphql/context";
import { DBDataSource } from "./utils/graphql/data.sources/db.source";
import { schema } from "./utils/graphql/schema";
import path from "path";
import { myFormatError } from "./utils/graphql/format.error";
import { MovieDataSource } from "./utils/graphql/data.sources/movie.source";
import { avatarRouter } from "./utils/routers/user.images";
import fastifyStatic from "@fastify/static";

dotenv.config();

const PORT = process.env.PORT === undefined ? 8080 : Number.parseInt(process.env.PORT);
const server = fastify({ logger: true });

export const appRoot = path.resolve(__dirname, "../");

const apollo = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
        fastifyApolloDrainPlugin(server),
        process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageProductionDefault({
          graphRef: 'my-graph-id@my-graph-variant',
          footer: false,
        })
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ],
    nodeEnv: process.env.NODE_ENV,
    formatError: myFormatError
});

export const LOG = server.log;
export const DB = new DBDataSource();
export const MOVIEDB = new MovieDataSource();

(async () => {
    await apollo.start();

    await server.register(fastifyApollo(apollo), { context });
    await server.register(avatarRouter, { prefix: "/user" });
    await server.register(fastifyStatic, {
        root: path.join(appRoot, "public"),
        wildcard: false,
    });

    server.listen({ port: PORT, host: "0.0.0.0" }, async (err, add) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }

        //server started
    });
})();
