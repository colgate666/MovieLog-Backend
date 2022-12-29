import { z } from "zod";

export const WatchlistItem = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    movie_id: z.number().int(),
});

export const WatchedMovie = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    movie_id: z.number().int(),
    liked: z.boolean(),
    rating: z.number().optional(),
    review: z.string().optional(),
    added_date: z.string().datetime(),
});

export type WatchlistItem = z.infer<typeof WatchlistItem>;
export type WatchedMovie = z.infer<typeof WatchedMovie>;
