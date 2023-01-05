import { Arg, Ctx, Field, ID, InputType, ObjectType, Query, Resolver } from "type-graphql";
import { GraphQLContext } from "../context";

@ObjectType()
class Cast {
    @Field(type => ID)
    id!: number

    @Field()
    name!: string

    @Field()
    character_name!: string

    @Field({ nullable: true })
    image?: string
}

@ObjectType()
class Crew {
    @Field(type => ID)
    id!: number

    @Field()
    name!: string

    @Field({ nullable: true })
    job?: string

    @Field({ nullable: true })
    image?: string
}

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

    @Field({ nullable: true })
    imagePath?: string

    @Field()
    rating!: number

    @Field(type => [String])
    genres!: string[]

    @Field({ nullable: true })
    budget?: number

    @Field({ nullable: true })
    revenue?: number

    @Field(type => [Crew], { nullable: true })
    crew?: Crew[]

    @Field(type => [Cast], { nullable: true })
    cast?: Cast[]
}

@ObjectType()
export class MoviePages {
    @Field(type => [Movie])
    movies!: Movie[]

    @Field()
    total_results!: number

    @Field()
    total_pages!: number

    @Field()
    page!: number
}

@InputType()
export class MovieByQueryInput {
    @Field()
    query!: string

    @Field()
    page!: number
}

@Resolver(MoviePages)
export class MoviePagesResolver {
    @Query(returns => MoviePages)
    async getMoviesByQuery(
        @Arg("input") input: MovieByQueryInput,
        @Ctx() context: GraphQLContext,
    ) {
        const movies = await context.dataSources.movieSource.getMoviesByQuery(input.query, input.page);

        if (!movies) {
            throw new Error("Error fetching movies");
        }

        return movies;
    }
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
