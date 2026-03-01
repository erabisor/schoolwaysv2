const authService = require('./auth.service');

// Recibe la petición, llama al servicio y responde al cliente
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'Faltan datos' });
    }

    const resultado = await authService.login(correo, password);

    if (!resultado.ok) {
      return res.status(401).json(resultado);
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error en el servidor' });
  }
};

module.exports = { login };