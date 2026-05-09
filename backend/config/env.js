const requiredVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'DB_SERVER',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_PORT'
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Falta la variable de entorno: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
};