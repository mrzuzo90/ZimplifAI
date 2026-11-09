export interface UF0894Question {
  n: number | string;
  t: string; // temática
  q: string; // enunciado de la pregunta
  o: string[]; // opciones disponibles
  a: number | null; // índice de la opción correcta (0-indexed, null si no disponible)
  x: string; // retroalimentación / explicación
  p: number; // página en el documento de referencia
  needsFigure?: boolean;
}

export interface UF0894Exercise {
  id: string;
  title: string;
  topic: string;
  data: string;
  steps: string[];
  answer: string;
  page: number;
}

export const ORIGINAL_QUESTIONS: UF0894Question[] = [
  {
    "n": 1,
    "t": "Instalación",
    "q": "Aquellos conductores aislados para una tensión nominal inferior a 0,6/1 kV se considerarán conductores:",
    "o": [
      "Aislados.",
      "Desnudos.",
      "Semiconductores.",
      "No se considerarán conductores."
    ],
    "a": 1,
    "x": "El documento señala que para tener condición de aislado, el cable debe tener envolvente aislante con tensión nominal no inferior a 0,6/1 kV (pág. 30).",
    "p": 30
  },
  {
    "n": 2,
    "t": "Instalación",
    "q": "Los conductores desnudos mantendrán las condiciones más desfavorables, con respecto al suelo de:",
    "o": [
      "4 m.",
      "3 m.",
      "2 m.",
      "4 m, salvo lo especificado para cruzamientos."
    ],
    "a": 3,
    "x": "Enunciado y opciones transcritos del banco original. La respuesta se refiere a las condiciones de la ITC-BT-06 citada en el material; pág. 43.",
    "p": 43
  },
  {
    "n": 3,
    "t": "Instalación",
    "q": "En cruzamientos de líneas de BT con canalizaciones de agua se mantendrá una distancia mínima de 0,20 m en proyección horizontal y se procurará que las canalizaciones de agua:",
    "o": [
      "Queden por encima del nivel del cable eléctrico.",
      "Queden por debajo del nivel del cable eléctrico.",
      "Queden al mismo nivel que el cable eléctrico.",
      "Todas son falsas."
    ],
    "a": 1,
    "x": "El temario indica 0,20 m de separación y que la conducción de agua quede siempre por debajo del nivel del cable eléctrico (pág. 27).",
    "p": 27
  },
  {
    "n": 4,
    "t": "Instalación",
    "q": "La distancia mínima entre los cables de energía eléctrica y las canalizaciones de gas será de:",
    "o": [
      "0,20 m.",
      "1 m.",
      "0,20 m, excepto en gas de alta presión, donde será 0,40 m.",
      "0,50 m."
    ],
    "a": 2,
    "x": "La distancia general es 0,20 m; para gas de alta presión (más de 4 bar), 0,40 m (pág. 27).",
    "p": 27
  },
  {
    "n": 5,
    "t": "Normativa",
    "q": "Las instalaciones eléctricas de baja tensión que precisaron inspección inicial serán objeto de inspecciones periódicas cada:",
    "o": [
      "5 años.",
      "10 años.",
      "3 años.",
      "2 años."
    ],
    "a": 0,
    "x": "La pregunta aparece en el banco original. El plazo indicado en la normativa citada por el temario para instalaciones que requieren inspección inicial es de cinco años (pág. 43).",
    "p": 43
  },
  {
    "n": 6,
    "t": "Mantenimiento",
    "q": "Tras un mantenimiento se detecta una serie de defectos. Clasifícalos de acuerdo con su gravedad.",
    "o": [],
    "a": null,
    "x": "Pregunta abierta que depende de una lista/figura de defectos que no aparece legible en la copia consultada del documento. Se conserva el enunciado original; no se inventa la lista.",
    "p": 43,
    "needsFigure": true
  },
  {
    "n": 7,
    "t": "Protección",
    "q": "Los conductores estarán protegidos en cabecera contra sobrecargas y cortocircuitos mediante fusibles:",
    "o": [
      "NH clase gG.",
      "NH clase aG.",
      "NH clase gM.",
      "NH clase gL."
    ],
    "a": 0,
    "x": "El temario describe la protección de fase frente a sobrecarga y cortocircuito mediante fusible clase gG en el cuadro de BT del CT (pág. 8).",
    "p": 8
  },
  {
    "n": 8,
    "t": "Instalación",
    "q": "Las líneas subterráneas de distribución BT se instalarán:",
    "o": [
      "Por terrenos de dominio público.",
      "Bajo aceras o calzadas.",
      "Evitando ángulos pronunciados.",
      "Todas son correctas."
    ],
    "a": 3,
    "x": "El temario dice que, en general, discurrirán por terrenos de dominio público, preferentemente bajo aceras, con trazado recto y corto (pág. 30).",
    "p": 30
  },
  {
    "n": 9,
    "t": "Normativa",
    "q": "La red de distribución de IBERDROLA S.A. admite la instalación de cables enterrados solamente en zonas:",
    "o": [
      "Metropolitanas.",
      "Urbanas.",
      "No urbanas.",
      "En ningún caso."
    ],
    "a": null,
    "x": "El documento contiene la pregunta, pero el dato específico de la norma particular de la distribuidora no se explica en el texto extraído. No se asigna una solución que no esté sustentada por el material.",
    "p": 44
  },
  {
    "n": 10,
    "t": "Instalación",
    "q": "Cuando la intensidad máxima prevista para el circuito supera la admisible por el conductor:",
    "o": [
      "Se pueden colocar varios conductores por fase, iguales en material, sección y longitud, agrupados al tresbolillo en ternas.",
      "Siempre existe un cable apto para cualquier circuito.",
      "Se reduce la intensidad del circuito.",
      "No se colocará más de un conductor por fase aunque sean iguales."
    ],
    "a": 0,
    "x": "Es la opción que describe el paralelismo de conductores con iguales características y disposición al tresbolillo, recogida en la pregunta del módulo (pág. 44).",
    "p": 44
  },
  {
    "n": 11,
    "t": "Instalación",
    "q": "¿Qué características se indican para las canalizaciones subterráneas entubadas?",
    "o": [
      "Como máximo, 2 circuitos por tubo.",
      "Profundidad mínima de la base del tubo: 45 cm en aceras y 60 cm en otros casos.",
      "Profundidad mínima de 1,45 m en aceras y 2 m en otros casos.",
      "A y B son verdaderas."
    ],
    "a": 3,
    "x": "La opción combinada A+B es la solución propuesta por el test original (pág. 44).",
    "p": 44
  },
  {
    "n": 12,
    "t": "Instalación",
    "q": "En las redes subterráneas principales de BT se utilizarán siempre cables con sección uniforme de:",
    "o": [
      "150 mm² Al en fases y mínimo 95 mm² Al en neutro.",
      "240 mm² Al en fases y mínimo 150 mm² Al en neutro.",
      "50 mm² Al en fases y mínimo 25 mm² Al en neutro.",
      "16 mm² Al en fases y mínimo 6 mm² Al en neutro directamente enterrado."
    ],
    "a": null,
    "x": "La pregunta aparece en el cuestionario, pero este valor de proyecto tipo no está desarrollado en el texto visible consultado. Se mantiene sin clave para no atribuir una respuesta no demostrable por el material.",
    "p": 45
  },
  {
    "n": 13,
    "t": "Conductores",
    "q": "La sección de estos conductores será adecuada a las intensidades y caídas de tensión previstas y, en todo caso, no será inferior a:",
    "o": [
      "6 mm² Cu y 10 mm² Al.",
      "16 mm² Cu y 6 mm² Al.",
      "6 mm² Cu y 16 mm² Al.",
      "16 mm² Cu y 10 mm² Al."
    ],
    "a": 2,
    "x": "El temario establece secciones mínimas de 6 mm² para cobre y 16 mm² para aluminio (pág. 5).",
    "p": 5
  },
  {
    "n": 14,
    "t": "Conductores",
    "q": "La constitución interna de los cables unipolares utilizados en redes de distribución es:",
    "o": [
      "Cubierta de poliolefina, aislamiento de polietileno reticulado y conductor.",
      "Cubierta de polietileno reticulado, apantallado y conductor.",
      "Cubierta de poliolefina, aislamiento de polietileno reticulado, apantallado y conductor.",
      "Cubierta apantallada, aislamiento de polietileno reticulado y conductor."
    ],
    "a": 0,
    "x": "El documento identifica el cable XZ1 como polietileno reticulado con cubierta de poliolefina (pág. 5).",
    "p": 5
  },
  {
    "n": 15,
    "t": "Instalación",
    "q": "Las líneas subterráneas de distribución BT se instalarán:",
    "o": [
      "Por terrenos de dominio público.",
      "Bajo aceras o calzadas.",
      "Evitando ángulos pronunciados.",
      "Todas son correctas."
    ],
    "a": 3,
    "x": "Repetición del cuestionario original; véase la descripción del trazado en la pág. 30.",
    "p": 30
  },
  {
    "n": 16,
    "t": "Instalación",
    "q": "¿Qué características se indican para las canalizaciones subterráneas entubadas?",
    "o": [
      "Como máximo, 2 circuitos por tubo.",
      "Profundidad mínima de la base del tubo: 45 cm en aceras y 60 cm en otros casos.",
      "Profundidad mínima de 1,45 m en aceras y 2 m en otros casos.",
      "A y B son verdaderas."
    ],
    "a": 3,
    "x": "Repetición del cuestionario original (pág. 45).",
    "p": 45
  },
  {
    "n": 17,
    "t": "Instalación",
    "q": "Si la intensidad máxima prevista supera la admisible por el conductor:",
    "o": [
      "Se pueden colocar varios conductores por fase, iguales en material, sección y longitud, agrupados al tresbolillo en ternas.",
      "Siempre existe un cable apto para cualquier circuito.",
      "Se reduce la intensidad del circuito.",
      "No se colocará más de un conductor por fase aunque sean iguales."
    ],
    "a": 0,
    "x": "Repetición del cuestionario original (pág. 45).",
    "p": 45
  },
  {
    "n": 18,
    "t": "Instalación",
    "q": "Completa con las dimensiones correspondientes al proyecto tipo de Iberdrola para redes subterráneas de baja tensión.",
    "o": [],
    "a": null,
    "x": "Ejercicio gráfico; la ilustración con las cotas no se pudo recuperar en la copia legible. Se conserva el enunciado y la referencia a la página 45.",
    "p": 45,
    "needsFigure": true
  },
  {
    "n": 19,
    "t": "Protección",
    "q": "Un fusible se ha fundido. ¿Qué ha ocurrido?",
    "o": [
      "Una sobrecarga.",
      "Un contacto directo.",
      "Una sobretensión."
    ],
    "a": 0,
    "x": "Los fusibles protegen frente a sobrecargas y cortocircuitos (pág. 8); el test da sobrecarga como respuesta disponible.",
    "p": 8
  },
  {
    "n": 20,
    "t": "Normativa",
    "q": "Las instalaciones BT que precisaron inspección inicial serán objeto de inspecciones periódicas cada:",
    "o": [
      "5 años.",
      "10 años.",
      "3 años.",
      "2 años."
    ],
    "a": 0,
    "x": "Repetición de la pregunta original (pág. 46).",
    "p": 46
  },
  {
    "n": 21,
    "t": "Mantenimiento",
    "q": "Los principales fallos en las redes de distribución subterráneas son:",
    "o": [
      "Excesivo calentamiento.",
      "Destrucción del aislamiento.",
      "Ninguna es correcta.",
      "Las dos son correctas."
    ],
    "a": 3,
    "x": "El temario indica que una corriente superior a la admisible puede destruir el conductor por calor excesivo (pág. 54), y trata el aislamiento como parte esencial del cable.",
    "p": 54
  },
  {
    "n": 22,
    "t": "Mantenimiento",
    "q": "¿Qué método de búsqueda de avería no podemos realizar con un geófono?",
    "o": [
      "Localización acústica convencional.",
      "Medición relativa de la falla.",
      "Indicación digital de la falla.",
      "Indicación analógica de la falla."
    ],
    "a": null,
    "x": "El cuestionario incluye las opciones, pero el documento no desarrolla el funcionamiento del geófono ni ofrece su clave. No se adivina la respuesta.",
    "p": 46
  },
  {
    "n": 23,
    "t": "Normativa",
    "q": "¿Cuál de las siguientes ITC está dedicada a redes subterráneas para distribución en baja tensión?",
    "o": [
      "ITC-21.",
      "ITC-19.",
      "ITC-6.",
      "ITC-7."
    ],
    "a": 3,
    "x": "La ITC-BT-07 regula redes subterráneas para distribución en BT; el documento la cita expresamente en el cálculo de intensidad (pág. 58).",
    "p": 58
  },
  {
    "n": 24,
    "t": "Mantenimiento",
    "q": "El mantenimiento puede ser:",
    "o": [
      "Predictivo.",
      "Preventivo.",
      "Correctivo.",
      "Todas son correctas."
    ],
    "a": 3,
    "x": "La opción del test reconoce los tres tipos de mantenimiento (pág. 46).",
    "p": 46
  },
  {
    "n": 25,
    "t": "Mantenimiento",
    "q": "En las inspecciones periódicas de redes eléctricas subterráneas BT, ¿qué medidas o ensayos deben realizarse según ITC-BT-05? ¿Y cómo se comprueba la protección contra choques eléctricos?",
    "o": [],
    "a": null,
    "x": "Pregunta abierta del documento. La prueba específica no queda desarrollada en el banco de preguntas; debe responderse consultando la ITC-BT-05 citada, no se inventa una solución.",
    "p": 46
  },
  {
    "n": 26,
    "t": "Instalación",
    "q": "Indica las distancias mínimas según ITC-BT-07 que deben cumplirse para dar como favorable una instalación tras una revisión periódica.",
    "o": [],
    "a": null,
    "x": "Respuesta desarrollada en el temario: BT con BT 0,10 m; BT con AT 0,25 m; telecomunicaciones 0,20 m; agua 0,20 m (1 m en empalmes/juntas); gas 0,20 m (0,40 m si alta presión >4 bar; 1 m entre empalmes eléctricos y juntas de gas); acometidas 0,20 m. Pág. 27.",
    "p": 27
  },
  {
    "n": 27,
    "t": "Protección",
    "q": "Un fusible se ha fundido. ¿Qué ha ocurrido?",
    "o": [
      "Una sobrecarga.",
      "Un contacto directo.",
      "Una sobretensión."
    ],
    "a": 0,
    "x": "Repetición del cuestionario original (pág. 47).",
    "p": 47
  },
  {
    "n": 28,
    "t": "Instalación",
    "q": "Las líneas BT con conductores desnudos deben cruzar por encima de las telecomunicaciones. Excepcionalmente podrán cruzar por debajo si:",
    "o": [
      "Se emplean conductores aislados 0,6/1 kV en el vano de cruce de BT.",
      "Las líneas de telecomunicaciones están entubadas.",
      "Se emplean conductores aislados 0,6/1 kV en el vano de cruce de telecomunicaciones.",
      "A y C son correctas."
    ],
    "a": 3,
    "x": "El test original combina las dos medidas A y C como excepciones posibles (pág. 48).",
    "p": 48
  },
  {
    "n": 29,
    "t": "Instalación",
    "q": "Aquellos conductores aislados para una tensión nominal inferior a 0,6/1 kV se considerarán:",
    "o": [
      "Aislados.",
      "Desnudos.",
      "No se considerarán conductores."
    ],
    "a": 1,
    "x": "Según el temario, un conductor aislado debe tener tensión nominal no inferior a 0,6/1 kV (pág. 30).",
    "p": 30
  },
  {
    "n": 30,
    "t": "Instalación",
    "q": "Los conductores desnudos mantendrán respecto al suelo, en las condiciones más desfavorables:",
    "o": [
      "4 m.",
      "3 m.",
      "2 m.",
      "4 m, salvo lo especificado para cruzamientos."
    ],
    "a": 3,
    "x": "Ítem repetido; la pregunta remite a ITC-BT-06 (pág. 48).",
    "p": 48
  },
  {
    "n": 31,
    "t": "Instalación",
    "q": "En cruzamientos de líneas BT con canalizaciones de agua, estas deben quedar:",
    "o": [
      "Por encima del cable eléctrico.",
      "Por debajo del cable eléctrico.",
      "Al mismo nivel.",
      "Todas son falsas."
    ],
    "a": 1,
    "x": "La canalización de agua debe quedar por debajo del cable eléctrico y se procura 0,20 m de separación horizontal (pág. 27).",
    "p": 27
  },
  {
    "n": 32,
    "t": "Instalación",
    "q": "La distancia mínima entre cables eléctricos y canalizaciones de gas será:",
    "o": [
      "0,20 m.",
      "1 m.",
      "0,20 m, salvo gas de alta presión, donde será 0,40 m.",
      "0,50 m."
    ],
    "a": 2,
    "x": "Repetición; la regla está descrita en la pág. 27.",
    "p": 27
  },
  {
    "n": 33,
    "t": "Normativa",
    "q": "Las instalaciones BT que precisaron inspección inicial serán inspeccionadas periódicamente cada:",
    "o": [
      "5 años.",
      "10 años.",
      "3 años.",
      "2 años."
    ],
    "a": 0,
    "x": "Repetición del cuestionario original (pág. 48).",
    "p": 48
  },
  {
    "n": 34,
    "t": "Instalación",
    "q": "Indica las distancias mínimas que se han de respetar conforme a la ITC-BT-06 para pasar las inspecciones periódicas.",
    "o": [],
    "a": null,
    "x": "Pregunta abierta. El temario adjunto desarrolla las distancias de redes directamente enterradas bajo ITC-BT-07 (pág. 27), pero no detalla aquí toda la ITC-BT-06. Mantener diferenciadas ambas referencias.",
    "p": 48
  },
  {
    "n": 35,
    "t": "Mantenimiento",
    "q": "Los principales fallos en las redes subterráneas son:",
    "o": [
      "Excesivo calentamiento.",
      "Destrucción del aislamiento.",
      "Ninguna es correcta.",
      "Las dos son correctas."
    ],
    "a": 3,
    "x": "Repetición del cuestionario original (pág. 49).",
    "p": 49
  },
  {
    "n": 36,
    "t": "Normativa",
    "q": "¿Qué ITC está dedicada a redes subterráneas de distribución BT?",
    "o": [
      "ITC-21.",
      "ITC-19.",
      "ITC-6.",
      "ITC-7."
    ],
    "a": 3,
    "x": "La ITC-BT-07 se ocupa de las líneas subterráneas de BT (pág. 58).",
    "p": 58
  },
  {
    "n": 37,
    "t": "Mantenimiento",
    "q": "¿Qué método de búsqueda de avería no podemos realizar con un geófono?",
    "o": [
      "Localización acústica convencional.",
      "Medición relativa de la falla.",
      "Indicación digital de la falla.",
      "Indicación analógica de la falla."
    ],
    "a": null,
    "x": "El material no aporta la clave ni describe estas técnicas; queda sin solución automática (pág. 49).",
    "p": 49
  },
  {
    "n": 38,
    "t": "Mantenimiento",
    "q": "El mantenimiento puede ser:",
    "o": [
      "Predictivo.",
      "Preventivo.",
      "Correctivo.",
      "Todas son correctas."
    ],
    "a": 3,
    "x": "Repetición del cuestionario original (pág. 49).",
    "p": 49
  },
  {
    "n": 39,
    "t": "Mantenimiento",
    "q": "Relaciona cada instrumento con su funcionalidad.",
    "o": [],
    "a": null,
    "x": "Ejercicio gráfico de relación; la imagen de instrumentos/funciones no está disponible en el texto extraído. Enunciado conservado (pág. 49).",
    "p": 49,
    "needsFigure": true
  },
  {
    "n": 40,
    "t": "Mantenimiento",
    "q": "¿Cómo se realiza la prueba de aislamiento?",
    "o": [],
    "a": null,
    "x": "Pregunta abierta original. El temario no especifica procedimiento ni valores en este apartado; conservar como actividad de desarrollo (pág. 50).",
    "p": 50
  },
  {
    "n": 41,
    "t": "Mantenimiento",
    "q": "¿Cómo se realiza la prueba de rigidez dieléctrica? ¿Qué resultados podría darnos?",
    "o": [],
    "a": null,
    "x": "Pregunta abierta original; no se ofrece una respuesta desarrollada en el documento visible (pág. 50).",
    "p": 50
  },
  {
    "n": 42,
    "t": "Redes aéreas",
    "q": "El tendido de las redes de distribución puede ser:",
    "o": [
      "Sobre apoyos metálicos, de hormigón o madera.",
      "De alta y media tensión.",
      "Aéreo, subterráneo y mixto."
    ],
    "a": 2,
    "x": "El documento afirma que las redes de distribución BT pueden ser aéreas o subterráneas; el test añade la opción mixta (pág. 3 y pág. 50).",
    "p": 3
  },
  {
    "n": 43,
    "t": "Redes aéreas",
    "q": "La ITC-BT-06 especifica que las redes aéreas en baja tensión:",
    "o": [
      "Podrán ser con o sin elemento fiador.",
      "Van posadas sobre abrazaderas aislantes.",
      "Pueden disponer de neutro fiador o cable fiador."
    ],
    "a": 2,
    "x": "El banco original propone como respuesta la opción del neutro fiador o cable fiador (pág. 50).",
    "p": 50
  },
  {
    "n": 44,
    "t": "Redes aéreas",
    "q": "Los apoyos metálicos pueden ser de:",
    "o": [
      "Perfiles metálicos o chapa plegada.",
      "Hormigón vibrado o tubular.",
      "Hierro fundido o inoxidable."
    ],
    "a": 0,
    "x": "La opción indicada en el cuestionario es perfiles metálicos o chapa plegada (pág. 50).",
    "p": 50
  },
  {
    "n": 45,
    "t": "Conductores",
    "q": "Los conductores desnudos son de aluminio porque:",
    "o": [
      "Brillan menos que el cobre.",
      "Pesan menos que el cobre.",
      "Conducen mejor que el cobre."
    ],
    "a": 1,
    "x": "El aluminio presenta menor peso que el cobre, según la opción correcta del test (pág. 50).",
    "p": 50
  },
  {
    "n": 46,
    "t": "Redes aéreas",
    "q": "Los aisladores sirven para:",
    "o": [
      "Proteger la avifauna.",
      "Soportar el conductor en el apoyo.",
      "Impedir el paso a personas ajenas."
    ],
    "a": 1,
    "x": "La función descrita en el test es sostener el conductor en el apoyo (pág. 50).",
    "p": 50
  },
  {
    "n": 47,
    "t": "Redes aéreas",
    "q": "Un conector de perforación de aislamiento (Niled) se utiliza para:",
    "o": [
      "Continuar redes subterráneas desnudas trenzadas de BT.",
      "Derivar redes aéreas desnudas de AT.",
      "Derivar redes aéreas aisladas trenzadas de BT."
    ],
    "a": 2,
    "x": "La respuesta del cuestionario es la derivación de redes de distribución aéreas aisladas trenzadas de BT (pág. 50).",
    "p": 50
  },
  {
    "n": 48,
    "t": "Redes aéreas",
    "q": "Para conductores aislados en redes aéreas, la tensión asignada será:",
    "o": [
      "450/750 V.",
      "300/500 V.",
      "0,6/1 kV."
    ],
    "a": 2,
    "x": "La opción correcta del test es 0,6/1 kV (pág. 50).",
    "p": 50
  },
  {
    "n": 49,
    "t": "Conductores",
    "q": "La sección mínima permitida para conductores de cobre en redes aéreas será:",
    "o": [
      "10 mm².",
      "16 mm².",
      "6 mm²."
    ],
    "a": 2,
    "x": "Respuesta propuesta en el test original (pág. 50).",
    "p": 50
  },
  {
    "n": 50,
    "t": "Conductores",
    "q": "Según el número de conductores de la red, la sección mínima del neutro será:",
    "o": [
      "Con dos o tres conductores, igual a la de las fases.",
      "Solo con tres conductores, igual a la de las fases.",
      "Todas son falsas."
    ],
    "a": 0,
    "x": "El documento indica que el neutro tendrá sección igual a la fase salvo en distribución trifásica con neutro, donde aplica el mínimo indicado en tabla (pág. 5).",
    "p": 5
  },
  {
    "n": 51,
    "t": "Tierras",
    "q": "En esquemas TT y TN, el neutro y el conductor de protección en TN-S deberán ponerse a tierra como mínimo:",
    "o": [
      "Cada 2 apoyos.",
      "Cada 500 m.",
      "Cada 100 m."
    ],
    "a": 1,
    "x": "El temario fija como mínimo una puesta a tierra cada 500 m de longitud de línea (pág. 8).",
    "p": 8
  },
  {
    "n": 52,
    "t": "Redes aéreas",
    "q": "Completa con el tipo de apoyo según su función.",
    "o": [],
    "a": null,
    "x": "Actividad gráfica; las figuras que permiten asociar cada apoyo a su función no están disponibles en la copia legible. Enunciado conservado (pág. 51).",
    "p": 51,
    "needsFigure": true
  },
  {
    "n": 53,
    "t": "Redes aéreas",
    "q": "Completa la tabla con las cargas del cálculo mecánico según las hipótesis y tipos de apoyos de ITC-BT-06.",
    "o": [],
    "a": null,
    "x": "Tabla de cálculo mecánico incluida como actividad, pero sus celdas/valores dependen de la imagen (pág. 51).",
    "p": 51,
    "needsFigure": true
  },
  {
    "n": 54,
    "t": "Redes aéreas",
    "q": "Un conector de perforación de aislamiento (Niled) se utiliza para:",
    "o": [
      "Continuar redes subterráneas desnudas trenzadas de BT.",
      "Derivar redes aéreas desnudas de AT.",
      "Derivar redes aéreas aisladas trenzadas de BT."
    ],
    "a": 2,
    "x": "Pregunta repetida en el cuestionario (pág. 52).",
    "p": 52
  },
  {
    "n": 55,
    "t": "Redes aéreas",
    "q": "Los apoyos metálicos pueden ser de:",
    "o": [
      "Perfiles metálicos o chapa plegada.",
      "Hormigón vibrado o tubular.",
      "Hierro fundido o inoxidable."
    ],
    "a": 0,
    "x": "Pregunta repetida del test original (pág. 52).",
    "p": 52
  },
  {
    "n": 56,
    "t": "Electricidad",
    "q": "La oposición que ofrece un elemento conductor al paso de la corriente eléctrica se llama:",
    "o": [
      "Conductividad.",
      "Intensidad de corriente.",
      "Resistencia."
    ],
    "a": 2,
    "x": "La resistencia eléctrica se opone al paso de corriente; concepto incluido en el apartado de cálculo (pág. 55).",
    "p": 55
  },
  {
    "n": 57,
    "t": "Redes aéreas",
    "q": "El tendido de las redes de distribución puede ser:",
    "o": [
      "Sobre apoyos metálicos, de hormigón o madera.",
      "De alta y media tensión.",
      "Aéreo, subterráneo y mixto."
    ],
    "a": 2,
    "x": "Pregunta repetida del test original (pág. 52).",
    "p": 52
  },
  {
    "n": 58,
    "t": "Redes aéreas",
    "q": "Los aisladores sirven para:",
    "o": [
      "Proteger la avifauna.",
      "Soportar el conductor en el apoyo.",
      "Impedir el paso a personas ajenas."
    ],
    "a": 1,
    "x": "Pregunta repetida del test original (pág. 52).",
    "p": 52
  },
  {
    "n": 59,
    "t": "Electricidad",
    "q": "La unidad de medida de la tensión es:",
    "o": [
      "El voltio.",
      "El amperio.",
      "El vatio."
    ],
    "a": 0,
    "x": "La tensión se expresa en voltios (pág. 53).",
    "p": 53
  },
  {
    "n": 60,
    "t": "Conductores",
    "q": "Los conductores desnudos son de aluminio porque:",
    "o": [
      "Brillan menos que el cobre.",
      "Pesan menos que el cobre.",
      "Conducen mejor que el cobre."
    ],
    "a": 1,
    "x": "Pregunta repetida; la respuesta marcada por el cuestionario es menor peso que el cobre (pág. 53).",
    "p": 53
  },
  {
    "n": 61,
    "t": "Protección",
    "q": "Un fusible protege contra:",
    "o": [
      "Sobrecargas.",
      "Contactos directos.",
      "Sobretensiones."
    ],
    "a": 0,
    "x": "El temario atribuye a los fusibles la protección frente a sobrecargas y cortocircuitos (pág. 8).",
    "p": 8
  },
  {
    "n": 62,
    "t": "Electricidad",
    "q": "Los conductores de redes de distribución en alta tensión:",
    "o": [
      "Tienen tensión nominal superior a 1.000 V en corriente alterna.",
      "Tienen tensión nominal inferior a 1.000 V en corriente alterna.",
      "Ninguna es correcta."
    ],
    "a": 0,
    "x": "El ítem adopta el umbral de 1.000 V de CA para distinguir alta tensión (pág. 53).",
    "p": 53
  },
  {
    "n": 63,
    "t": "Redes aéreas",
    "q": "Identifica los elementos que componen el siguiente apoyo.",
    "o": [],
    "a": null,
    "x": "Actividad de identificación basada en una imagen que no está disponible en la copia legible. Se mantiene el enunciado original (pág. 53).",
    "p": 53,
    "needsFigure": true
  }
];

export const EXTRA_QUESTIONS: UF0894Question[] = [
  {
    "n": "E1",
    "t": "Instalación",
    "q": "¿Qué profundidad mínima de zanja indica el temario en acera y en cruce de calzada?",
    "o": [
      "50 cm y 65 cm.",
      "65 cm en acera y 85 cm en cruce de calzada.",
      "60 cm y 80 cm.",
      "85 cm en ambos casos."
    ],
    "a": 1,
    "x": "La zanja tendrá 65 cm de profundidad en acera y 85 cm en cruces de calzada. La parte inferior del cable quedará al menos a 60/80 cm respectivamente.",
    "p": 33
  },
  {
    "n": "E2",
    "t": "Instalación",
    "q": "¿Qué separación se deja entre la zanja y las tierras extraídas?",
    "o": [
      "20 cm.",
      "30 cm.",
      "Unos 50 cm.",
      "1 m."
    ],
    "a": 2,
    "x": "El texto recomienda dejar unos 50 cm para facilitar el tránsito y evitar la caída de tierras a la zanja.",
    "p": 33
  },
  {
    "n": "E3",
    "t": "Conductores",
    "q": "¿Qué tensión nominal tienen los cables RV y XZ1 más utilizados en estas redes?",
    "o": [
      "230/400 V.",
      "300/500 V.",
      "0,6/1 kV.",
      "1,5/3 kV."
    ],
    "a": 2,
    "x": "El temario identifica los tipos RV y XZ1 con tensión nominal 0,6/1 kV.",
    "p": 5
  },
  {
    "n": "E4",
    "t": "Tierras",
    "q": "Al desconectar el neutro mediante uniones amovibles, ¿qué secuencia de maniobra se debe seguir?",
    "o": [
      "Desconectar neutro antes que fases y conectar fases antes que neutro.",
      "Desconectar fases antes que neutro y conectar neutro antes que fases.",
      "Desconectar fases y neutro simultáneamente siempre.",
      "El orden es indiferente."
    ],
    "a": 1,
    "x": "La secuencia explícita es seccionar fases antes que neutro y conectar neutro antes que fases.",
    "p": 8
  },
  {
    "n": "E5",
    "t": "Protección",
    "q": "¿Qué elemento protege habitualmente la fase en el cuadro de BT del centro de transformación?",
    "o": [
      "Fusible gG.",
      "Fusible aM.",
      "Interruptor diferencial.",
      "Varistor."
    ],
    "a": 0,
    "x": "El temario indica fusible clase gG para sobrecargas y cortocircuitos; el neutro se conecta directamente.",
    "p": 8
  },
  {
    "n": "E6",
    "t": "Instalación",
    "q": "Si no se puede mantener la distancia reglamentaria entre una canalización eléctrica enterrada y otra instalación, ¿qué solución describe el temario?",
    "o": [
      "Desplazar siempre la instalación existente.",
      "Entubar la canalización instalada más recientemente.",
      "Reducir la profundidad.",
      "Poner cinta de señalización entre ambas."
    ],
    "a": 1,
    "x": "Cuando no se puede respetar la separación indicada, el temario dispone la canalización más reciente entubada.",
    "p": 27
  },
  {
    "n": "E7",
    "t": "Instalación",
    "q": "¿Qué reducción de intensidad admisible aplica el temario a cables instalados en zanja dentro de tubos?",
    "o": [
      "Multiplicar por 0,5.",
      "Multiplicar por 0,8.",
      "Sumar un 20 %.",
      "No se aplica corrección."
    ],
    "a": 1,
    "x": "La intensidad de tabla se reduce multiplicándola por 0,8; el valor es un 20 % inferior al enterramiento directo.",
    "p": 59
  },
  {
    "n": "E8",
    "t": "Cálculo",
    "q": "En una línea trifásica equilibrada, ¿qué expresión usa el temario para estimar la intensidad a partir de P, U y cos φ?",
    "o": [
      "I=P/U.",
      "I=P/(U·cos φ).",
      "I=P/(√3·U·cos φ).",
      "I=√3·P/U."
    ],
    "a": 2,
    "x": "Para tres fases, P=√3·U·I·cos φ, por lo que I=P/(√3·U·cos φ).",
    "p": 55
  },
  {
    "n": "E9",
    "t": "Cálculo",
    "q": "¿Qué resistividad del aluminio utiliza el documento en sus ejemplos?",
    "o": [
      "0,0178 Ω·mm²/m.",
      "0,0282 Ω·mm²/m.",
      "0,61 Ω·km.",
      "1 Ω·mm²/m."
    ],
    "a": 1,
    "x": "El valor indicado es ρAl=0,0282 Ω·mm²/m.",
    "p": 55
  },
  {
    "n": "E10",
    "t": "Cálculo",
    "q": "¿Qué tres criterios usa el documento para comprobar la sección de un conductor?",
    "o": [
      "Coste, peso y longitud.",
      "Intensidad admisible, caída de tensión y pérdida de potencia.",
      "Resistencia, reactancia y frecuencia.",
      "Aislamiento, cubierta y color."
    ],
    "a": 1,
    "x": "El apartado de cálculo enumera esos tres criterios de selección.",
    "p": 54
  },
  {
    "n": "E11",
    "t": "Instalación",
    "q": "¿Qué profundidad de enterramiento se toma como condición tipo para las tablas de intensidad máxima en instalación directamente enterrada?",
    "o": [
      "0,5 m.",
      "0,7 m.",
      "0,9 m.",
      "1,0 m."
    ],
    "a": 1,
    "x": "Las condiciones tipo de ITC-BT-07 se describen con profundidad de 0,7 m, terreno a 25 °C y resistividad térmica media 1 K·m/W.",
    "p": 58
  },
  {
    "n": "E12",
    "t": "Instalación",
    "q": "¿Qué temperatura del terreno adopta el documento para esas tablas de enterramiento directo?",
    "o": [
      "15 °C.",
      "20 °C.",
      "25 °C.",
      "40 °C."
    ],
    "a": 2,
    "x": "La temperatura del terreno a esa profundidad se considera 25 °C.",
    "p": 58
  },
  {
    "n": "E13",
    "t": "Normativa",
    "q": "¿Cuál es el límite global de caída de tensión y pérdida de potencia admisible que recoge el temario para la red de distribución BT incluida la acometida?",
    "o": [
      "3 %.",
      "5 %.",
      "7 %.",
      "10 %."
    ],
    "a": 2,
    "x": "El documento indica que la caída de tensión y pérdida de potencia admisibles no podrán superar el 7 % en conjunto (pág. 11).",
    "p": 11
  },
  {
    "n": "E14",
    "t": "Instalación",
    "q": "¿Qué norma se cita para tubos protectores de canalizaciones enterradas?",
    "o": [
      "UNE-HD-603.",
      "UNE-EN 50086-2-4.",
      "UNE-EN 60204.",
      "IEC 60947."
    ],
    "a": 1,
    "x": "La sección sobre tubos enterrados cita UNE-EN 50086-2-4.",
    "p": 33
  },
  {
    "n": "E15",
    "t": "Montaje",
    "q": "Antes de manipular los conductores, ¿cómo se debe garantizar la ausencia de tensión?",
    "o": [
      "Mediante inspección visual.",
      "Con un comprobador adecuado.",
      "Midiendo solo continuidad.",
      "Esperando cinco minutos."
    ],
    "a": 1,
    "x": "El texto exige dejar sin tensión la línea y comprobar la ausencia de tensión con un comprobador adecuado.",
    "p": 30
  },
  {
    "n": "E16",
    "t": "Montaje",
    "q": "¿Cuántos operarios como mínimo deben estar presentes en los lugares de ejecución según el temario?",
    "o": [
      "Uno.",
      "Dos.",
      "Tres.",
      "Cuatro."
    ],
    "a": 1,
    "x": "Se indica un mínimo de dos operarios, con guantes, alfombra aislante y otros medios de seguridad.",
    "p": 30
  },
  {
    "n": "E17",
    "t": "Cálculo",
    "q": "Con ρ=0,0282 Ω·mm²/m, L=600 m y S=142,1 mm², ¿qué resistencia aproximada tiene un conductor?",
    "o": [
      "0,0119 Ω.",
      "0,119 Ω.",
      "1,19 Ω.",
      "11,9 Ω."
    ],
    "a": 1,
    "x": "Aplicando R=ρ·L/S resulta aproximadamente 0,119 Ω, como indica la solución del ejemplo de caída de tensión.",
    "p": 56
  },
  {
    "n": "E18",
    "t": "Tierras",
    "q": "¿Dónde se conecta a tierra el neutro de la red de distribución de la compañía?",
    "o": [
      "En cada CGP.",
      "En el centro de transformación o central generadora.",
      "Solo en el último usuario.",
      "Nunca se conecta a tierra."
    ],
    "a": 1,
    "x": "El temario indica conexión en el CT o central generadora, además de las puestas a tierra adicionales en TT/TN descritas.",
    "p": 8
  },
  {
    "n": "E19",
    "t": "Instalación",
    "q": "¿Qué tensión nominal proporciona el transformador considerada para los cálculos de BT?",
    "o": [
      "230/115 V.",
      "400/230 V.",
      "690/400 V.",
      "12/24 kV."
    ],
    "a": 1,
    "x": "El documento establece 400/230 V como tensión nominal del transformador en el cálculo de la red BT.",
    "p": 10
  },
  {
    "n": "E20",
    "t": "Instalación",
    "q": "¿Qué intensidad se toma como condición de instalación al aire para las tablas de ITC-BT-07?",
    "o": [
      "Ambiente a 25 °C, sin renovación de aire.",
      "Ambiente a 40 °C con renovación eficaz del aire.",
      "Terreno a 25 °C.",
      "Ambiente a 70 °C."
    ],
    "a": 1,
    "x": "El apartado de instalación al aire considera renovación eficaz y temperatura ambiente de 40 °C.",
    "p": 59
  }
];

export const EXERCISES: UF0894Exercise[] = [
  {
    "id": "Ejemplo 5.1",
    "title": "Sección por caída de tensión (monofásica)",
    "topic": "Caída de tensión",
    "data": "P = 10 kW · cos φ = 0,9 · U = 230 V · L = 0,6 km · aluminio ρ = 0,0282 Ω·mm²/m · caída máxima = 5 %",
    "steps": [
      "Intensidad: I = P/(U·cos φ) = 10.000/(230·0,9) ≈ 48,3 A.",
      "Caída admisible: ΔU = 0,05·230 = 11,5 V.",
      "Para monofásica, ΔU = 2·I·R; con R=ρ·L/S, despejar S = 2·I·ρ·L/ΔU.",
      "S mínima calculada ≈ 142,1 mm². Elegir la sección normalizada inmediatamente superior compatible con los demás criterios."
    ],
    "answer": "R = 0,119 Ω; S mínima = 142,1 mm².",
    "page": 56
  },
  {
    "id": "Ejemplo 2",
    "title": "Pérdida de potencia (trifásica)",
    "topic": "Pérdida de potencia",
    "data": "P = 2.500 kW · cos φ = 0,9 · U = 20 kV · L = 10 km · conductor LA-56 · R = 0,61 Ω/km",
    "steps": [
      "Intensidad: I=P/(√3·U·cos φ)=2.500.000/(√3·20.000·0,9)≈80,2 A.",
      "Resistencia total: Rtotal=0,61·10=6,1 Ω.",
      "Pérdida trifásica: ΔP=3·I²·Rtotal≈118 kW.",
      "Porcentaje: 118/2.500·100≈4,7 %."
    ],
    "answer": "I = 80,2 A; ΔP = 118 kW; pérdida = 4,7 %.",
    "page": 57
  },
  {
    "id": "Ejercicio 3",
    "title": "Pérdida de potencia con cobre",
    "topic": "Pérdida de potencia",
    "data": "Mismos datos del ejemplo 2; cobre S = 70 mm² · ρCu = 0,0178 Ω·mm²/m.",
    "steps": [
      "Mantener I≈80,2 A del caso anterior.",
      "R=ρ·L/S=0,0178·10.000/70≈2,543 Ω.",
      "ΔP=3·I²·R≈49,1 kW.",
      "%ΔP=49,1/2.500·100≈2,0 %."
    ],
    "answer": "ΔP = 49,1 kW; pérdida = 2,0 %.",
    "page": 57
  },
  {
    "id": "Ejercicio 4",
    "title": "Pérdida de potencia con aluminio",
    "topic": "Pérdida de potencia",
    "data": "Mismos datos del ejemplo 2; aluminio S = 95 mm² · ρAl = 0,0282 Ω·mm²/m.",
    "steps": [
      "I≈80,2 A.",
      "R=0,0282·10.000/95≈2,968 Ω.",
      "ΔP=3·I²·R≈57,1 kW.",
      "%ΔP=57,1/2.500·100≈2,29 %."
    ],
    "answer": "ΔP = 57,1 kW; pérdida = 2,29 %.",
    "page": 57
  },
  {
    "id": "Ejercicio 5",
    "title": "Sección por pérdida máxima (trifásica)",
    "topic": "Pérdida de potencia",
    "data": "P = 18 kW · cos φ = 0,9 · U = 400 V · L = 600 m · cobre ρ = 0,0178 Ω·mm²/m · ΔP máxima = 5 %.",
    "steps": [
      "I=P/(√3·U·cos φ)≈28,9 A.",
      "Pérdida admisible: 0,05·18.000=900 W.",
      "Para trifásica ΔP=3·I²·R; despejar R=ΔP/(3·I²)≈0,3592 Ω.",
      "S=ρ·L/R=0,0178·600/0,3592≈29,73 mm²."
    ],
    "answer": "I = 28,9 A; ΔP = 900 W; R = 0,3592 Ω; Smin = 29,73 mm².",
    "page": 57
  },
  {
    "id": "Ejercicio 6",
    "title": "Sección por pérdida máxima (monofásica)",
    "topic": "Pérdida de potencia",
    "data": "P = 10 kW · cos φ = 0,8 · U = 230 V · L = 0,8 km · cobre ρ=0,0178 Ω·mm²/m · ΔP máxima=5 %.",
    "steps": [
      "I=P/(U·cos φ)≈54,4 A.",
      "ΔP admisible=500 W.",
      "En monofásica ΔP=2·I²·R, de donde R≈0,0845 Ω.",
      "S=ρ·L/R≈168,5 mm²."
    ],
    "answer": "I = 54,4 A; ΔP = 500 W; R = 0,0845 Ω; Smin = 168,5 mm².",
    "page": 57
  },
  {
    "id": "Ejercicio 7",
    "title": "Sección por pérdida máxima (monofásica)",
    "topic": "Pérdida de potencia",
    "data": "P = 11 kW · cos φ = 0,9 · U = 230 V · L = 0,4 km · aluminio ρ=0,0282 Ω·mm²/m · ΔP máxima=3 %.",
    "steps": [
      "I≈53,2 A.",
      "ΔP admisible=330 W.",
      "R=ΔP/(2·I²)≈0,0583 Ω.",
      "S=ρ·L/R≈193,5 mm²."
    ],
    "answer": "I = 53,2 A; ΔP = 330 W; R = 0,0583 Ω; Smin = 193,5 mm².",
    "page": 57
  },
  {
    "id": "Ejercicio 8",
    "title": "Comprobar intensidad admisible · enterramiento directo",
    "topic": "Intensidad admisible",
    "data": "Trifásica · U=400 V · P=110 kW · cos φ=0,85 · enterramiento directo. Comprobar 25 mm² Al unipolar XLPE; 50 mm² tetrapolar Al con neutro concéntrico Cu XLPE; 16 mm² Cu unipolar EPR; 70 mm² Cu unipolar XLPE.",
    "steps": [
      "Calcular la intensidad de carga: I=110.000/(√3·400·0,85)≈186,8 A.",
      "Consultar la tabla de ITC-BT-07 para enterramiento directo (págs. 63–64), seleccionando conductor por material, sección, cable y aislamiento.",
      "Comparar cada Iadm de tabla con 186,8 A: cumple si Iadm≥186,8 A.",
      "Aplicar las condiciones tipo del temario: profundidad 0,7 m, terreno 25 °C y resistividad térmica 1 K·m/W."
    ],
    "answer": "Intensidad de línea = 186,8 A. El PDF no trae los valores de tabla como texto legible; la comparación final requiere consultar las tablas gráficas de las págs. 63–64.",
    "page": 59
  },
  {
    "id": "Ejercicio 9",
    "title": "Comprobar intensidad admisible · tubo enterrado",
    "topic": "Intensidad admisible",
    "data": "Monofásica · U=230 V · P=38 kW · cos φ=0,9 · zanja con tubo. Comprobar 50 mm² Al multipolar EPR; 50 mm² tetrapolar Al con neutro concéntrico Cu XLPE; 70 mm² Cu unipolar XLPE; 70 mm² Cu multipolar PVC.",
    "steps": [
      "I=38.000/(230·0,9)≈183,6 A.",
      "Consultar la tabla aplicable de ITC-BT-07 y aplicar el factor de tubo 0,8 a la intensidad de tabla.",
      "Para cada alternativa, Iadm corregida=Iadm tabla·0,8.",
      "Comparar con 183,6 A; solo cumple una alternativa si su valor corregido alcanza la intensidad de carga."
    ],
    "answer": "Intensidad de línea = 183,6 A. Valores de intensidad de tabla no extraíbles como texto del PDF; completar con las tablas gráficas de las págs. 63–64.",
    "page": 59
  },
  {
    "id": "Ejercicio 10",
    "title": "Comprobar intensidad admisible · galería al aire",
    "topic": "Intensidad admisible",
    "data": "Trifásica · U=400 V · P=110 kW · cos φ=0,9 · instalación al aire en galería. Comprobar 50 mm² Al multipolar PVC; 50 mm² tetrapolar Al/Ne concéntrico Cu XLPE; 16 mm² Cu unipolar EPR; 70 mm² Cu unipolar XLPE.",
    "steps": [
      "I=110.000/(√3·400·0,9)≈176,5 A.",
      "Consultar tabla de ITC-BT-07 para instalación al aire (pág. 64), según conductor y aislamiento.",
      "Considerar condiciones de la tabla: renovación eficaz del aire y ambiente a 40 °C.",
      "Comparar cada Iadm con 176,5 A."
    ],
    "answer": "Intensidad de línea = 176,5 A. La respuesta por conductor debe contrastarse con las tablas gráficas de la pág. 64.",
    "page": 60
  },
  {
    "id": "Ejercicio 11",
    "title": "Sección mínima por intensidad admisible",
    "topic": "Intensidad admisible",
    "data": "Trifásica · U=400 V · P=90 kW · cos φ=0,9 · enterramiento directo. Determinar sección mínima para Al unipolar XLPE y Cu multipolar PVC.",
    "steps": [
      "I=90.000/(√3·400·0,9)≈144,3 A.",
      "Consultar tablas ITC-BT-07 de instalación directamente enterrada.",
      "En cada familia de cable, elegir la menor sección cuya intensidad admisible sea al menos 144,3 A.",
      "Comprobar que la sección también cumple caída de tensión y pérdida de potencia."
    ],
    "answer": "Intensidad de línea = 144,3 A. La sección se obtiene de las tablas gráficas de las págs. 63–64.",
    "page": 60
  },
  {
    "id": "Ejercicio 12",
    "title": "Sección mínima por intensidad admisible · tubo",
    "topic": "Intensidad admisible",
    "data": "Trifásica · U=400 V · P=89 kW · cos φ=0,85 · zanja en el interior de tubo. Determinar sección mínima para Al multipolar EPR y Cu unipolar XLPE.",
    "steps": [
      "I=89.000/(√3·400·0,85)≈151,2 A.",
      "Consultar intensidad admisible en tablas ITC-BT-07 según cable y aislamiento.",
      "Aplicar factor de corrección por tubo: Iadm corregida=Iadm tabla·0,8.",
      "Escoger la menor sección corregida que soporte al menos 151,2 A."
    ],
    "answer": "Intensidad de línea = 151,2 A. La selección final depende de las intensidades de tabla gráficas.",
    "page": 60
  },
  {
    "id": "Ejercicio 13",
    "title": "Sección mínima por intensidad admisible · canal revisable",
    "topic": "Intensidad admisible",
    "data": "Monofásica · U=230 V · P=30 kW · cos φ=0,9 · instalación al aire en canal revisable. Determinar sección mínima para Al multipolar PVC; cable tetrapolar Al con neutro concéntrico Cu XLPE; Cu unipolar EPR.",
    "steps": [
      "I=30.000/(230·0,9)≈145 A.",
      "Usar tablas de ITC-BT-07 para instalación al aire/canal revisable.",
      "Verificar las condiciones de renovación de aire y temperatura ambiente.",
      "Para cada tipo de cable, escoger la menor sección cuya Iadm sea ≥145 A."
    ],
    "answer": "Intensidad de línea = 145 A. La sección final requiere consultar las tablas de la pág. 64.",
    "page": 60
  },
  {
    "id": "Ejercicio 3.23",
    "title": "Comprobación completa de una línea monofásica",
    "topic": "Cálculo combinado",
    "data": "P=25 kW · cos φ=0,9 · U=230 V · L=400 m · Al unipolar XLPE de 50 mm² en tubo enterrado. Calcular caída de tensión, pérdida de potencia y comprobar densidad de corriente.",
    "steps": [
      "I=P/(U·cos φ)=25.000/(230·0,9)≈121 A.",
      "La intensidad admisible indicada en la solución es 144 A: 121 A<144 A, por tanto no se supera.",
      "R=ρ·L/S=0,0282·400/50≈0,2256 Ω.",
      "ΔU=2·I·R≈54,5 V; porcentaje=54,5/230·100≈23,7 %.",
      "ΔP=2·I²·R≈6,6 kW; porcentaje=6,6/25·100≈26,3 %.",
      "Conclusión del material: aunque no supera Iadm, la caída y pérdida resultan muy elevadas respecto a los porcentajes habituales admisibles."
    ],
    "answer": "I=121 A; Iadm=144 A; ΔU=54,5 V (23,7 %); ΔP=6,6 kW (26,3 %).",
    "page": 60
  }
];
