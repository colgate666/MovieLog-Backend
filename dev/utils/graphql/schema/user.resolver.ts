import { Arg, Ctx, Field, ID, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { Message } from "../../types/message";
import { GraphQLContext } from "../context";
import { v4 } from "uuid";
import { saveFromBase64 } from "../../image.handler";

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
        const imgPath = await saveFromBase64(id, avatar);

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

    @Mutation(returns => String)
    async login(
        @Arg("user") user: string,
        @Arg("password") password: string,
        @Ctx() context: GraphQLContext,
    ) {
        const result = await context.dataSources.dbSource.isRegistered(user, password);
        const message = await Message.spa(result);

        if (message.success) {
            throw new Error(JSON.stringify(message.data));
        }

        return result as string;
    }
}
