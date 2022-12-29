import { createPool, DatabasePool, sql } from "slonik";
import { LOG } from "../../..";
import { User, UserRegister } from "../../types/db.types/user";
import { Message } from "../../types/message";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { WatchedMovie, WatchlistItem } from "../../types/db.types/movies";
import { Watchlist } from "../schema/watchlist.resolver";
import { WatchedMovies } from "../schema/review.resolver";

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

    async addToWatchlist(user: string, movie: number): Promise<boolean> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchlistItem)`
                    INSERT INTO watchlists(user_id, movie_id)
                    VALUES(${user}, ${movie})
                `;

                await conn.query(query);

                return true;
            });
        } catch (err) {
            LOG.error(err);
            return false;
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

    async getWatchedMovies(user: string): Promise<WatchedMovies | null> {
        try {
            return await this.dbPool!.connect(async conn => {
                const query = sql.type(WatchedMovie)`
                    SELECT * FROM watched
                    WHERE user_id = ${user}
                `;

                const result = await conn.query(query);

                return {
                    user_id: user,
                    movies: result.rows.map(v => ({
                        movie_id: v.movie_id,
                        liked: v.liked,
                        added_date: v.added_date,
                        review: v.review,
                        rating: v.rating,
                    })),
                };
            });
        } catch (err) {
            LOG.error(err);
            return null;
        }
    }
}