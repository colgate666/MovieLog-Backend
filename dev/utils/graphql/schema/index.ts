import { buildSchemaSync } from "type-graphql";
import { MoviePagesResolver, MovieResolver } from "./movie.resolver";
import { UserResolver } from "./user.resolver";

export const schema = buildSchemaSync({
    resolvers: [UserResolver, MovieResolver, MoviePagesResolver],
    validate: { forbidUnknownValues: false }
});
