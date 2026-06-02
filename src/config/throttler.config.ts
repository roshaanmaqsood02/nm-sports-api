import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  // Default / Global
  global: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  // Auth routes (login / register / forgot-password)
  auth: {
    ttl: parseInt(process.env.THROTTLE_AUTH_TTL ?? '900000', 10),
    limit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '10', 10),
  },

  // Public read routes
  public: {
    ttl: parseInt(process.env.THROTTLE_PUBLIC_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_PUBLIC_LIMIT ?? '300', 10),
  },
}));
