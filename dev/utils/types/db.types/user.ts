import { z } from "zod";

export const User = z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    password: z.string(),
    avatar: z.string().optional(),
});

export const UserRegister = User.omit({
    id: true,
});

export type User = z.infer<typeof User>;
export type UserRegister = z.infer<typeof UserRegister>;