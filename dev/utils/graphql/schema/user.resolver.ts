import { Arg, Ctx, Field, ID, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { Message } from "../../types/message";
import { GraphQLContext } from "../context";
import { saveFromBase64 } from "../../image.handler";
import { IsBase64, IsEmail, Length } from "class-validator";

@ObjectType()
class User {
    @Field(type => ID)
    id!: string;

    @Field()
    username!: string;

    @Field()
    email!: string;

    @Field()
    password!: string;

    @Field({ nullable: true })
    avatar?: string;
}

@InputType()
class RegisterInput implements Partial<User> {
    @Field()
    @Length(3, 30, { message: "Username length must be between 3 and 30 characters." })
    username!: string;

    @Field()
    @IsEmail()
    email!: string;

    @Field()
    @Length(3, 30, { message: "Password length must be between 3 and 30 characters." })
    password!: string;

    @Field({ nullable: true })
    avatar?: string;
}

@InputType()
class LoginInput implements Partial<User> {
    @Field()
    user!: string;

    @Field()
    @Length(3, 30, { message: "Password length must be between 3 and 30 characters." })
    password!: string;
}

@Resolver(User)
export class UserResolver {

    @Query(returns => User)
    async getUserByUsernameOrEmail(
        @Arg("user") user: string,
        @Ctx() context: GraphQLContext,
    ) {
        const result = await context.dataSources.dbSource.getUserByNameOrEmail(user, user);
        const message = await Message.spa(result);

        if (message.success) {
            throw new Error(message.data.message);
        }

        return result;
    }

    @Mutation(returns => User)
    async addUser(
        @Arg("input") registerInput: RegisterInput,
        @Ctx() context: GraphQLContext,
    ): Promise<User> {
        const result = await context.dataSources.dbSource.insertUser({
            email: registerInput.email,
            password: registerInput.password,
            username: registerInput.username,
        });

        const isMessage = await Message.spa(result);

        if (isMessage.success) {
            throw new Error(isMessage.data.message);
        }

        const usr = result as User;

        await saveFromBase64(usr.id, registerInput.avatar);
        return usr;
    }

    @Mutation(returns => String)
    async login(
        @Arg("input") loginInput: LoginInput,
        @Ctx() context: GraphQLContext,
    ) {
        const result = await context.dataSources.dbSource.isRegistered(
            loginInput.user, loginInput.password
        );
        const message = await Message.spa(result);

        if (message.success) {
            throw new Error(message.data.message);
        }

        return result as string;
    }
}
