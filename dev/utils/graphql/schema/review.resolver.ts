import { Ctx, Field, ID, ObjectType, Query, Resolver } from "type-graphql";
import { GraphQLContext } from "../context";

@ObjectType()
export class MovieReview {
    @Field()
    movie_id!: number;

    @Field()
    liked!: boolean;

    @Field({ nullable: true })
    rating?: number;

    @Field({ nullable: true })
    review?: string;

    @Field()
    added_date!: string;
}

@ObjectType()
export class WatchedMovies {
    @Field(type => ID)
    user_id!: string;

    @Field(type => [MovieReview])
    movies!: MovieReview[];
}

@Resolver(WatchedMovies)
export class WatchedMoviesResolver { 
    @Query(returns => WatchedMovies)
    async getWatchedMovies(@Ctx() context: GraphQLContext) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        const watchedMovies = await context.dataSources.dbSource.getWatchedMovies(context.user.id);

        if (!watchedMovies) {
            throw new Error("Error fetching watched movies. Try again later.");
        }

        return watchedMovies;
    }
}