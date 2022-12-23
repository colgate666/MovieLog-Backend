import { Arg, Ctx, Field, ID, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { Message } from "../../types/message";
import { GraphQLContext } from "../context";
import { v4 } from "uuid";
import fs, { mkdir, writeFile } from "fs";
import path from "path";
import { appRoot } from "../../..";
import { promisify } from "util";
import { detectMimeType } from "../../mimetype";

@ObjectType()
class User {
    @Field(type => ID)
    id!: string;

    @Field()
    username!: string;

    @Field()
    email!: string;

    @Field({ nullable: true })
    avatar?: string;
}

@Resolver(User)
export class UserResolver {
    @Query(returns => User)
    async getUser(): Promise<User> {
        return {
           email: "asd",
           username: "asdasd",
           id: "asdasdasd"
        }
    }

    @Mutation(returns => User)
    async addUser(
        @Arg("username") username: string,
        @Arg("email") email: string,
        @Arg("password") password: string,
        @Ctx() context: GraphQLContext,
        @Arg("image", { nullable: true }) avatar?: string,
    ): Promise<User> {
        const id = v4();
        let imgPath: string | undefined;
        
        if (avatar) {
            const buffer = Buffer.from(avatar, "base64");
            const mimetype = detectMimeType(avatar);

            const md = promisify(mkdir);
            const wf = promisify(writeFile);
            const ip = path.join(appRoot, "public", "images", "avatars");

            await md(ip, { recursive: true });
            const p = path.join(ip, `${id}.${mimetype}`); 

            await wf(p, buffer);
            imgPath = p;
        }

        const result = await context.dataSources.dbSource.insertUser({
            email,
            password,
            username,
            avatar: imgPath,
        }, id);

        const isMessage = await Message.spa(result);

        if (isMessage.success) {
            throw new Error(JSON.stringify(isMessage.data));
        }

        return result as User;
    }
}
