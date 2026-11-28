export interface Section {
  path: string;
  label: string;
  summary: string;
}

export const sections: Section[] = [
  { path: 'aprende/', label: 'Aprende', summary: 'Lecciones guiadas desde la primera partida.' },
  { path: 'reglas/', label: 'Reglas', summary: 'Índice del reglamento por número.' },
  { path: 'mazos/', label: 'Mazos', summary: 'Colores, preferencias y mazos de entrada.' },
  { path: 'simuladores/', label: 'Simuladores', summary: 'Práctica de combate, turnos y efectos.' },
  { path: 'glosario/', label: 'Glosario', summary: 'Palabras clave y conceptos en dos idiomas.' },
  { path: 'qa/', label: 'Q&A', summary: 'Aclaraciones oficiales por set y mecánica.' },
  { path: 'casos/', label: 'Casos y desafíos', summary: 'Situaciones prácticas con resolución.' },
  { path: 'actualizaciones/', label: 'Actualizaciones', summary: 'Versiones y estado de las fuentes.' },
  { path: 'acerca/', label: 'Acerca', summary: 'Fuentes, metodología y aviso no oficial.' },
];
