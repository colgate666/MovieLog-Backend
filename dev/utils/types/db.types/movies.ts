import { z } from "zod";

const MovieItem = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    movie_id: z.number().int(),
});

export const WatchlistItem = MovieItem;
export const LikedMovie = MovieItem;

export const MovieReviewDB = MovieItem.extend({
    rating: z.number().optional(),
    review: z.string().optional(),
    added_date: z.string().datetime(),
});

export type WatchlistItem = z.infer<typeof MovieItem>;
export type LikedMovie = z.infer<typeof MovieItem>;
export type MovieReviewDB = z.infer<typeof MovieReviewDB>;
