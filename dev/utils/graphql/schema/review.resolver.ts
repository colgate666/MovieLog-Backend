import {Arg, Ctx, Field, ID, InputType, Mutation, ObjectType, Query, Resolver} from "type-graphql";
import { GraphQLContext } from "../context";

@ObjectType()
export class ReviewBody {
    @Field(type => ID)
    id!: string;

    @Field()
    movie_id!: number;

    @Field()
    user_id!: string;

    @Field()
    username!: string;

    @Field()
    avatar?: string;

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

@InputType()
export class ReviewInput {
    @Field()
    movie_id!: number;

    @Field({ nullable: true })
    rating?: number;

    @Field({ nullable: true })
    review?: string;

    @Field()
    added_date!: string;
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

        return await context.dataSources.dbSource.removeFromLikes(context.user.id, movie_id);
    }

    @Query(returns => [Number])
    async likedMovies(@Arg("movie_id") movie_id: number, @Ctx() context: GraphQLContext) {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        const response = await context.dataSources.dbSource.getUserLikes(context.user.id);

        if (response) {
            return response;
        }

        return [];
    }

    @Query(returns => [ReviewBody])
    async movieReviews(@Arg("movie_id") movie_id: number, @Ctx() context: GraphQLContext): Promise<ReviewBody[]> {
        const response = await context.dataSources.dbSource.getMovieReviews(movie_id);

        if (response === null) {
            throw new Error("Error fetching movie reviews.");
        }

        return response;
    }

    @Query(returns => [ReviewBody])
    async userReviews(@Arg("user_id") user_id: string, @Ctx() context: GraphQLContext): Promise<ReviewBody[]> {
        const response = await context.dataSources.dbSource.getUserReviews(user_id);

        if (response === null) {
            throw new Error("Error fetching user movie reviews.");
        }

        return response;
    }

    @Mutation(returns => Boolean)
    async addReview(@Arg("input") input: ReviewInput, @Ctx() context: GraphQLContext): Promise<Boolean> {
        if (!context.user) {
            throw new Error("Auth token missing. Cannot retrieve user data.");
        }

        return await context.dataSources.dbSource.addMoviewReview(input, context.user.id);
    }
}