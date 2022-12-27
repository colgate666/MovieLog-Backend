import { buildSchemaSync } from "type-graphql";
import { MovieResolver } from "./movie.resolver";
import { UserResolver } from "./user.resolver";

export const schema = buildSchemaSync({
    resolvers: [UserResolver, MovieResolver],
    validate: { forbidUnknownValues: false }
});
