import { ApolloServer } from 'apollo-server-express';
import { Application } from 'express';
import { typeDefs } from './schema';
import { resolvers, createContext } from './resolvers';
import { config } from '../config';
import { logger } from '../utils/logger';

export const setupGraphQL = async (app: Application): Promise<void> => {
  if (!config.graphql.enabled) {
    logger.info('GraphQL is disabled');
    return;
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    introspection: config.env === 'development' || config.graphql.playground,
    playground: config.graphql.playground,
    formatError: (error) => {
      logger.error('GraphQL error:', error);
      return {
        message: error.message,
        code: error.extensions?.code,
        ...(config.env === 'development' && { stack: error.stack }),
      };
    },
    plugins: [
      {
        requestDidStart: () => ({
          didEncounterErrors: (requestContext) => {
            logger.error('GraphQL request errors:', requestContext.errors);
          },
        }),
      },
    ],
  });

  await server.start();
  server.applyMiddleware({
    app,
    path: config.graphql.path,
    cors: false, // CORS is handled by the main app
  });

  logger.info(`🚀 GraphQL server ready at ${config.graphql.path}`);
  if (config.graphql.playground) {
    logger.info(`🎮 GraphQL Playground available at ${config.graphql.path}`);
  }
};
