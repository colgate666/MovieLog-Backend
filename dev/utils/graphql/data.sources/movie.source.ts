import { MovieDb } from "moviedb-promise";
import { LOG } from "../../..";
import { Movie, MoviePages } from "../schema/movie.resolver";

export class MovieDataSource {
    private movieDb: MovieDb;

    constructor() {
        this.movieDb = new MovieDb(process.env.MOVIEDB_KEY!);
    }

    async trendingMovies(): Promise<Number[] | null> {
        try {
            const trendingMovies = await this.movieDb.trending({
                media_type: "movie",
                time_window: "week",
            });

            if (!trendingMovies.results) {
                return null;
            }
            
            return trendingMovies.results.map(v => v.id!);
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async getMovieById(id: number): Promise<Movie | null> {
        try {
            const movie = await this.movieDb.movieInfo({ id });
            const credits = await this.movieDb.movieCredits({ id });

            return {
                id: movie.id!,
                imagePath: movie.poster_path,
                overview: movie.overview!,
                rating: movie.vote_average!,
                release_date: movie.release_date!,
                title: movie.title!,
                genres: movie.genres!.map(genre => genre.name!),
                budget: movie.budget,
                revenue: movie.revenue,
                cast: credits.cast?.map(value => ({
                    id: value.id!,
                    name: value.original_name!,
                    character_name: value.character!,
                    image: value.profile_path!
                })),
                crew: credits.crew?.map(value => ({
                    id: value.id!,
                    name: value.name!,
                    job: value.job!,
                    image: value.profile_path!
                }))
            }
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async getMoviesByQuery(query: string, page: number): Promise<MoviePages | null> {
        try {
            const movies = await this.movieDb.searchMovie({ query, page })
            
            return {
                total_results: movies.total_results!,
                page: movies.page!,
                total_pages: movies.total_pages!,
                movies: movies.total_results === 0 ? [] : movies.results!.map<Movie>(v => ({
                    id: v.id!,
                    genres: [],
                    imagePath: v.poster_path,
                    overview: v.overview!,
                    rating: v.vote_average!,
                    release_date: v.release_date!,
                    title: v.title!
                }))
            }
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }
}