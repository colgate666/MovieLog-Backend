import { createPool, DatabasePool, sql } from "slonik";
import { LOG } from "../../..";
import { User, UserRegister } from "../../types/db.types/user";
import { Message } from "../../types/message";

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

    async insertUser(user: UserRegister, id: string): Promise<User | Message> {
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
                const query = sql.type(User)`
                    INSERT INTO users(id, username, email, password, avatar) 
                    VALUES(${id}, ${user.username}, ${user.email}, ${user.password}, ${user?.avatar ?? null})
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
}