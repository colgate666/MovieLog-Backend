import { MovieDb } from "moviedb-promise";
import { LOG } from "..";

export let movieDb: MovieDb;

export const movieDbClientInit = (): boolean => {
    try {
        movieDb = new MovieDb(process.env.MOVIEDB_KEY!);
        return true;
    } catch(err) {
        LOG.error(err);
        return false;
    }
}
