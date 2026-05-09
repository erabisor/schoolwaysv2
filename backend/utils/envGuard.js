// backend/utils/envGuard.js

function onlyProduction(actionName = 'Esta operación') {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`${actionName} está deshabilitada fuera de producción`);
  }
}

module.exports = {
  onlyProduction
};