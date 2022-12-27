import { MovieDb } from "moviedb-promise";
import { LOG } from "../../..";
import { Movie } from "../schema/movie.resolver";

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

            return {
                id: movie.id!,
                imagePath: movie.poster_path!,
                overview: movie.overview!,
                rating: movie.vote_average!,
                release_date: movie.release_date!,
                title: movie.title!,
                genres: movie.genres!.map(genre => genre.name!),
            }
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }
}