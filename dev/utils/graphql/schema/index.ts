import { buildSchemaSync } from "type-graphql";
import { UserResolver } from "./user.resolver";

export const schema = buildSchemaSync({
    resolvers: [UserResolver],
});
