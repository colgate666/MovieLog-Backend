import { createPool, DatabasePool, sql } from "slonik";
import { LOG } from "../../..";
import { User, UserRegister } from "../../types/db.types/user";
import { Message } from "../../types/message";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LikedMovie, MovieReviewDB, WatchlistItem } from "../../types/db.types/movies";
import { Watchlist } from "../schema/watchlist.resolver";
import {MovieReview, ReviewBody, ReviewInput} from "../schema/review.resolver";

export class DBDataSource {
    private dbPool: DatabasePool | undefined;

    constructor() {
        this.initializeDbConnection().then(pool => {
            if (pool) {
                this.dbPool = pool;
            } else {
                throw "Error connecting to database";
            }
        });
    }

    async initializeDbConnection(): Promise<DatabasePool | null> {
        try {
            return await createPool(process.env.DB_URI!);
        } catch(err) {
            LOG.error(err);
            return null;
        }
    }

    async insertUser(user: UserRegister): Promise<User | Message> {
        try {
            const registered = await this.getUserByNameOrEmail(user.username, user.email);
            const isMessage = await Message.spa(registered);

            if (isMessage.success && isMessage.data.code === 500) {
                return isMessage.data;
            } else if (!isMessage.success) {
                return {
                    message: "Username or email already registered.",
                    code: 400,
                };
            }

            return await this.dbPool!.connect(async conn => {
                const ePass = await bcrypt.hash(user.password, 11);

                const query = sql.type(User)`
                    INSERT INTO users(username, email, password, avatar) 
                    VALUES(${user.username}, ${user.email}, ${ePass}, ${user?.avatar ?? null})
                    RETURNING *
                `;

                return await conn.one(query);
            });
        } catch (err) {
            LOG.error(err);
            return {
                message: "Error registering user.",
                code: 500,
            };
        }
    }

    async setAvatar(id: string, file: string): Promise<Message> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(User)`
                    UPDATE users 
                    SET avatar = ${file}
                    WHERE id = ${id}
                `;

                await conn.query(query);

                return {
                    code: 200,
                    message: "Avatar updated",
                };
            });
        } catch (err) {
            LOG.error(err);
            return {
                message: "Error registering user.",
                code: 500,
            };
        }
    }

    async getUserByNameOrEmail(username: string, email: string): Promise<User | Message> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(User)`
                    SELECT * FROM users 
                    WHERE email = ${email}
                    OR username = ${username}
                `;

                const user = await conn.maybeOne(query);

                if (user) {
                    return user;
                } else {
                    return {
                        message: "User not found.",
                        code: 404,
                    };
                }
            });
        } catch (err) {
            LOG.error(err);
            return {
                message: "Error fetching users.",
                code: 500,
            };
        }
    }

    async getUser(userId: string): Promise<User | Message> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(User)`
                    SELECT * FROM users
                    WHERE id = ${userId}
                `;

                const user = await conn.maybeOne(query);

                if (user) {
                    return user;
                } else {
                    return {
                        message: "User not found.",
                        code: 404,
                    };
                }
            });
        } catch (err) {
            LOG.error(err);
            return {
                message: "Error fetching users.",
                code: 500,
            };
        }
    }

    async isRegistered(user: string, password: string): Promise<Message | string> {
        try {
            const res = await this.getUserById(user);
            const message = await Message.spa(res);

            if (message.success) {
                if (message.data.code === 404) {
                    return message.data;
                }

                return {
                    code: 500,
                    message: "Error loging in.",
                };
            }

            const usr = res as User;
            const same = await bcrypt.compare(password, usr.password);

            if (!same) {
                return {
                    code: 400,
                    message: "Incorrect password.",
                };
            }

            return jwt.sign(usr.id, process.env.JWT_SECRET!);
        } catch (err) {
            LOG.error(err);
            return {
                message: "Error fetching users.",
                code: 500,
            };
        }
    }

    async getUserById(id: string): Promise<User | Message> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(User)`
                    SELECT * FROM users 
                    WHERE id = ${id}
                `;

                const user = await conn.maybeOne(query);

                if (user) {
                    return user;
                } else {
                    return {
                        message: "User not found.",
                        code: 404,
                    };
                }
            });
        } catch (err) {
            LOG.error(err);
            return {
                message: "Error fetching users.",
                code: 500,
            };
        }
    }

    async isMovieInWatchlist(user: string, movie: number): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    SELECT * FROM watchlists 
                    WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                const result = await conn.maybeOne(query);

                return result != null;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }

    async getUserWatchlist(id: string): Promise<Watchlist | null> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    SELECT * FROM watchlists 
                    WHERE user_id = ${id}
                `;

                const result = await conn.query(query);

                return {
                    user_id: id,
                    movies: result.rows.map(v => v.movie_id),
                };
            });
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async addToWatchlist(user: string, movie: number): Promise<Message> {
        try {
            const isRegistered = await this.isMovieInWatchlist(user, movie);

            if (isRegistered) {
                return {
                    code: 200,
                    message: "Movie already in your watchlist.",
                };
            }

            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    INSERT INTO watchlists(user_id, movie_id)
                    VALUES(${user}, ${movie})
                `;

                await conn.query(query);

                return {
                    code: 200,
                    message: "Movie added to your watchlist.",
                };
            });
        } catch (err) {
            LOG.error(err);
            return {
                code: 500,
                message: "Error adding the movie to your watchlist.",
            };
        }
    }

    async removeFromWatchlist(user: string, movie: number): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    DELETE FROM watchlists
                    WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                await conn.query(query);

                return true;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }

    async getMovieReport(user: string, movie: number): Promise<MovieReview | null> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(LikedMovie)`
                    SELECT * FROM liked_movies WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                const liked = await conn.maybeOne(query) != null;

                const query2 = sql.type(MovieReviewDB)`
                    SELECT * FROM movie_reviews WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                const review = await conn.maybeOne(query2);

                const query3 = sql.type(User)`
                    SELECT username, avatar FROM users WHERE id = ${user}
                `;

                const userData = await conn.one(query3);

                return {
                    movie_id: movie,
                    liked,
                    inWatchlist: await this.isMovieInWatchlist(user, movie),
                    review: review === null ? undefined : {
                        id: review.id,
                        movie_id: review.movie_id,
                        user_id: user,
                        added_date: review.added_date,
                        rating: review.rating,
                        review: review.review,
                        username: userData.username,
                        avatar: userData.avatar
                    },
                };
            });
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async isMovieInLikes(user: string, movie: number): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    SELECT * FROM liked_movies 
                    WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                const result = await conn.maybeOne(query);

                return result != null;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }

    async addToLikes(user: string, movie: number): Promise<Message> {
        try {
            const isRegistered = await this.isMovieInLikes(user, movie);

            if (isRegistered) {
                return {
                    code: 200,
                    message: "Movie already in your likes.",
                };
            }

            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    INSERT INTO liked_movies(user_id, movie_id)
                    VALUES(${user}, ${movie})
                `;

                await conn.query(query);

                return {
                    code: 200,
                    message: "Movie added to your likes.",
                };
            });
        } catch (err) {
            LOG.error(err);
            return {
                code: 500,
                message: "Error adding the movie to your likes.",
            };
        }
    }

    async removeFromLikes(user: string, movie: number): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    DELETE FROM liked_movies
                    WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                await conn.query(query);

                return true;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }

    async getUserLikes(id: string): Promise<number[] | null> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    SELECT * FROM liked_movies
                    WHERE user_id = ${id}
                `;

                const result = await conn.query(query);

                return result.rows.map(v => v.movie_id)
            });
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async getUserReviews(user: string): Promise<ReviewBody[] | null> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(MovieReviewDB)`
                    SELECT
                        users.id as user_id,
                        users.username,
                        users.avatar,
                        movie_reviews.id,
                        movie_reviews.movie_id,
                        movie_reviews.added_date,
                        movie_reviews.review,
                        movie_reviews.rating
                    FROM movie_reviews
                    INNER JOIN users ON users.id = movie_reviews.user_id
                    WHERE users.id = ${user}
                `;

                const result = await conn.query(query);

                return result.rows.map(value => ({
                    id: value.id,
                    user_id: user,
                    movie_id: value.movie_id,
                    username: value.username,
                    avatar: value.avatar,
                    review: value.review,
                    rating: value.rating,
                    added_date: value.added_date
                }));
            });
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async getMovieReviews(movie: number): Promise<ReviewBody[] | null> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(MovieReviewDB)`
                    SELECT
                        users.id as user_id,
                        users.username,
                        users.avatar,
                        movie_reviews.id,
                        movie_reviews.movie_id,
                        movie_reviews.added_date,
                        movie_reviews.review,
                        movie_reviews.rating
                    FROM movie_reviews
                    INNER JOIN users ON users.id = movie_reviews.user_id
                    WHERE movie_reviews.movie_id = ${movie}
                `;

                const result = await conn.query(query);

                return result.rows.map(value => ({
                    id: value.id,
                    user_id: value.user_id,
                    movie_id: value.movie_id,
                    username: value.username,
                    avatar: value.avatar,
                    review: value.review,
                    rating: value.rating,
                    added_date: value.added_date
                }));
            });
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }

    async addMoviewReview(input: ReviewInput, user: string): Promise<boolean> {
        try {
            if (await this.isMovieReviewed(user, input.movie_id)) {
                return await this.updateMoviewReview(input, user);    
            }

            return await this.dbPool!.connect(async conn => {
                const query = sql.type(MovieReviewDB)`
                    INSERT INTO
                        movie_reviews(movie_id, user_id, review, rating, added_date)
                    VALUES
                        (${input.movie_id}, ${user}, ${input.review ?? null}, ${input.rating ?? null}, ${input.added_date})
                `;

                await conn.query(query);
                return true;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }

    async updateMoviewReview(input: ReviewInput, user: string): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(MovieReviewDB)`
                    UPDATE
                        movie_reviews
                    SET
                        review = ${input.review ?? null},
                        rating = ${input.rating ?? null},
                        added_date = ${input.added_date}
                    WHERE
                        movie_id = ${input.movie_id}
                    AND
                        user_id = ${user}
                `;

                await conn.query(query);
                return true;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }

    async isMovieReviewed(user: string, movie: number): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(MovieReviewDB)`
                    SELECT * FROM movie_reviews WHERE user_id = ${user} AND movie_id = ${movie}
                `;

                const result = await conn.maybeOne(query);
                return result !== null;
            });
        } catch (err) {
            LOG.error(err);
            return false;
        }
    }
}