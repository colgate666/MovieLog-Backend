import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { GraphQLContext } from "../context";

@ObjectType()
class ReviewBody {
    @Field({ nullable: true })
    rating?: number;

    @Field({ nullable: true })
    review?: string;

    @Field()
    added_date!: string;
}

@ObjectType()
export class MovieReview {
    @Field()
    movie_id!: number;

    @Field()
    liked!: boolean;

    @Field()
    inWatchlist!: boolean;

    @Field({ nullable: true })
    review?: ReviewBody;    
}

@Resolver(MovieReview)
export class MovieReviewResolver {
    @Query(returns => MovieReview)
    async getUserMovieReview(
        @Arg("movie_id") movie_id: number,
        @Ctx() context: GraphQLContext,
    ) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        const report = await context.dataSources.dbSource.getMovieReport(context.user.id, movie_id);

        if (!report) {
            throw new Error("Couldn't fetch movie review data");
        }

        return report;
    }

    @Mutation(returns => String)
    async likeMovie(
        @Arg("movie_id") movie_id: number,
        @Ctx() context: GraphQLContext,
    ) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        const response = await context.dataSources.dbSource.addToLikes(context.user.id, movie_id);

        if (response.code === 500) {
            throw new Error(response.message);
        }

        return response.message;
    }

    @Mutation(returns => Boolean)
    async unlikeMovie(
        @Arg("movie_id") movie_id: number,
        @Ctx() context: GraphQLContext,
    ) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        const response = await context.dataSources.dbSource.removeFromLikes(context.user.id, movie_id);

        return response;
    }
}