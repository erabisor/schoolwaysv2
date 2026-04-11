// ============================================================
// Constantes globales del sistema — usar en lugar de magic strings
// ============================================================

const ROL = {
  ADMIN:     1,
  CONDUCTOR: 2,
  PADRE:     3,
  ESTUDIANTE: 4
};

const ESTADO_TURNO = {
  ABIERTO: 'Abierto',
  CERRADO: 'Cerrado'
};

const ESTADO_VIAJE = {
  EN_CURSO:   'En Curso',
  FINALIZADO: 'Finalizado'
};

const SENTIDO_VIAJE = {
  IDA:    'Ida',
  VUELTA: 'Vuelta'
};

const TIPO_EVENTO = {
  ABORDÓ:         'Abordó',
  BAJÓ:           'Bajó',
  AUSENTE:        'Ausente',
  AVISÓ_AUSENCIA: 'AvisóAusencia'
};

const TIPO_SERVICIO = {
  AMBOS:      'Ambos',
  SOLO_IDA:   'Solo Ida',
  SOLO_VUELTA: 'Solo Vuelta'
};

module.exports = { ROL, ESTADO_TURNO, ESTADO_VIAJE, SENTIDO_VIAJE, TIPO_EVENTO, TIPO_SERVICIO };
