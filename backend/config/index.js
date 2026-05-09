// backend/config/index.js

require('./env'); // valida variables obligatorias

const config = {
  env: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT),

  database: {
    server: process.env.DB_SERVER,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET
  },

  frontend: {
    url: process.env.FRONTEND_URL
  }
};

module.exports = config;
