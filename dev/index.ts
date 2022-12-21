import dotenv from "dotenv";
import fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";

dotenv.config();

const PORT = process.env.PORT === undefined ? 8080 : Number.parseInt(process.env.PORT);
const server = fastify({ logger: true });

server.register(fastifyHelmet);

server.listen({ port: PORT, host: "0.0.0.0" }, (err, add) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }

    //server started
});
