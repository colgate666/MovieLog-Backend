export {};

declare module 'fastify' {
    interface FastifyRequest {
      user?: string
    }
  }