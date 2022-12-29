import { buildSchemaSync } from "type-graphql";
import { MoviePagesResolver, MovieResolver } from "./movie.resolver";
import { WatchedMoviesResolver } from "./review.resolver";
import { UserResolver } from "./user.resolver";
import { WatchlistResolver } from "./watchlist.resolver";

export const schema = buildSchemaSync({
  resolvers: [
    UserResolver,
    MovieResolver,
    MoviePagesResolver,
    WatchlistResolver,
    WatchedMoviesResolver,
  ],
  validate: { forbidUnknownValues: false },
});
