require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Levanta el servidor Node
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});