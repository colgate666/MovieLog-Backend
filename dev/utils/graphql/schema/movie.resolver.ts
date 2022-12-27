import { Arg, Ctx, Field, ID, ObjectType, Query, Resolver } from "type-graphql";
import { GraphQLContext } from "../context";

@ObjectType()
export class Movie {
    @Field(type => ID)
    id!: number

    @Field()
    title!: string

    @Field()
    release_date!: string

    @Field()
    overview!: string

    @Field()
    imagePath!: string

    @Field()
    rating!: number

    @Field(type => [String])
    genres!: string[]
}

@Resolver(Movie)
export class MovieResolver {
    @Query(returns => [Number])
    async getPopularMovies(@Ctx() context: GraphQLContext): Promise<Number[]> {
        const movies = await context.dataSources.movieSource.trendingMovies();

        if (movies) {
            return movies;
        } else {
            return [];
        }
    }

    @Query(returns => Movie)
    async getMovieById(
        @Arg("id") id: number,
        @Ctx() context: GraphQLContext
    ): Promise<Movie> {
        const movie = await context.dataSources.movieSource.getMovieById(id);

        if (!movie) {
            throw new Error("Movie not found.");
        }

        return movie;
    }
}
