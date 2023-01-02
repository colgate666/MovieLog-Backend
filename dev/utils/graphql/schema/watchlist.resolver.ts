import { Arg, Ctx, Field, ID, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { GraphQLContext } from "../context";
import { Movie } from "./movie.resolver";

@ObjectType()
export class Watchlist {
    @Field(type => ID)
    user_id!: string

    @Field(type => [Number])
    movies!: number[]
}

@Resolver(Watchlist)
export class WatchlistResolver {
    @Query(returns => Watchlist)
    async getWatchlist(@Ctx() context: GraphQLContext): Promise<Watchlist> {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        const watchlist = await context.dataSources.dbSource.getUserWatchlist(context.user.id);

        if (!watchlist) {
            throw new Error("Error fetching watchlist. Try again later.");
        }

        return watchlist;
    }

    @Mutation(returns => String)
    async addToWatchlist(
        @Arg("movie") movie: number,
        @Ctx() context: GraphQLContext 
    ) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot complete the requested operation.");
        }

        const response = await context.dataSources.dbSource.addToWatchlist(context.user.id, movie);
        
        if (response.code === 500) {
            throw new Error(response.message);
        }

        return response.message;
    }

    @Mutation(returns => Boolean)
    async removeFromWatchlist(
        @Arg("movie") movie: number,
        @Ctx() context: GraphQLContext 
    ) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot complete the requested operation.");
        }

        const added = await context.dataSources.dbSource.removeFromWatchlist(context.user.id, movie);
        return added;
    }
}