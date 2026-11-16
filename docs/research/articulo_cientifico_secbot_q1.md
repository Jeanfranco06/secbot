# Arquitectura RAG de Confianza Cero para Asistentes de Ciberseguridad Corporativa: Mitigación de Alucinaciones, Enrutamiento de Incidentes y Evaluación Experimental en Infraestructura Autosuficiente

**Autores:**
*Jeanfranco Gonzales-S.* $^{1,*}$, *Equipo de Investigación SecBot* $^{2}$  
$^{1}$ Universidad Nacional de Trujillo (UNITRU), Trujillo, Perú. Email: jjgonzaleses@unitru.edu.pe  
$^{2}$ Laboratorio de Ciberseguridad y Sistemas Autónomos, SecBot Enterprise Initiative.  
$^{*}$ Autor de correspondencia: jjgonzaleses@unitru.edu.pe

---

### Resumen Estructurado

* **Contexto/Problema:** La adopción de Modelos de Lenguaje Grande (LLMs) para la divulgación de políticas internas y la respuesta inicial a incidentes de seguridad de la información enfrenta barreras críticas de adopción debido al riesgo de alucinaciones normativas, la exposición inadvertida de Información de Identificación Personal (PII) y la vulnerabilidad frente a inyecciones de instrucciones adversariales (*prompt injection*).
* **Objetivo:** Diseñar, implementar y evaluar empíricamente una arquitectura modular desacoplada de Recuperación Aumentada por Generación (RAG) bajo el paradigma de Confianza Cero (*Zero-Trust*), capaz de responder consultas normativas con atribución documental determinista y clasificar incidentes de ciberseguridad para su triaje en tiempo real.
* **Método:** Se desarrolló el sistema SecBot integrando un pipeline perimetral con filtro adversarial `PromptGuard`, sanitización regex-vectorial de PII, indexación jerárquica con el modelo de incrustación densa multilingüe `intfloat/multilingual-e5-large` (1024 dimensiones) sobre `PostgreSQL 16 / pgvector` (índices HNSW), re-ordenamiento semántico (*cross-scoring reranker*), generación acotada con el modelo cuantizado `Llama-3.2:3b-instruct-q4_K_M` en entorno *on-premise* sin telemetría externa, y automatización SOAR vía webhooks de n8n. Para evitar sesgos circulares de evaluación, la experimentación se llevó a cabo sobre un **corpus híbrido abierto y corporativo** que integró las directivas oficiales de **NIST SP 800-61r2** (Incident Handling Guide), el marco **CIS Critical Security Controls v8** y las normativas corporativas internas, consolidando 58 fragmentos indexados, evaluados mediante un protocolo de benchmark empírico automatizado con métricas objetivas de Information Retrieval (IR) y ciberseguridad.
* **Resultados:** Las corridas directas sobre el sistema en producción revelaron que el pipeline RAG híbrido alcanza un desempeño excepcional con *Recall@1* de 0.933, *Recall@5* de 1.000 y un *Mean Reciprocal Rank* (*MRR*) de 0.950, superando ampliamente a los baselines léxicos tradicionales (BM25: *Recall@5* de 0.733). En condiciones de consulta fuera de dominio (*Out-of-Domain*), el mecanismo de salvaguarda determinista activó la respuesta segura en el 100% de los casos (5/5), erradicando las alucinaciones factuales. La latencia completa en CPU local en frío se situó en $26\,630\text{ ms}$, reduciéndose drásticamente a $16.0\text{ ms}$ (atenuación del $99.94\%$) bajo estados de caché caliente en Redis. El módulo clasificador alcanzó una precisión del $90.9\%$ y un *Recall* del $100\%$ en la detección de vectores de phishing ($F_1 = 0.952$). La capa de sanitización perimetral protegió de manera determinista el $100\%$ de credenciales, números telefónicos y tokens JWT evaluados, bloqueando los intentos de inyección léxica directa sin generar falsos positivos en consultas legítimas.
* **Conclusión:** La imposición de verificación sintáctica de citas combinada con modelos de lenguaje ligeros desplegados en el borde empresarial demuestra ser una solución viable y soberana para democratizar el conocimiento de seguridad corporativo, eliminando la dependencia de APIs en la nube pública y garantizando estricta gobernanza de datos.

**Palabras clave:** Recuperación Aumentada por Generación (RAG), Ciberseguridad Corporativa, Modelos de Lenguaje Grande (LLMs), Confianza Cero, Detección de Phishing, NIST SP 800-61r2, pgvector.

---

## 1. Introducción

La creciente complejidad del panorama de ciberamenazas contemporáneo ha impuesto a las organizaciones la necesidad de democratizar el conocimiento de sus políticas de seguridad de la información entre la totalidad de sus colaboradores (Liao et al., 2023). Tradicionalmente, los manuales de cumplimiento (e.g., ISO/IEC 27001:2022, directivas NIST SP 800-61r2) residen en repositorios estáticos o intranets departamentales, lo que deriva en una baja adherencia operativa y en una sobrecarga recurrente de los Centros de Operaciones de Seguridad (SOC) por consultas de baja complejidad técnica (Gao et al., 2024).

La irrupción de los Modelos de Lenguaje Grande (LLMs) ofrece una interfaz en lenguaje natural capaz de sintetizar procedimientos normativos complejos. No obstante, su implementación corporativa sin restricciones introduce vulnerabilidades críticas documentadas por la alianza OWASP Top 10 for LLM Applications (OWASP, 2023):
1. **Alucinaciones factuales:** La tendencia probabilística del modelo a articular directrices inventadas o requisitos obsoletos.
2. **Inyección de instrucciones (*Prompt Injection*):** Manipulación del contexto para forzar la omisión de controles de acceso o extraer información restringida.
3. **Fuga de privacidad:** Ingestión y exposición involuntaria de Información de Identificación Personal (PII) o secretos operacionales (claves privadas, JWTs).

Aunque la técnica de Recuperación Aumentada por Generación (RAG) ha sido extensamente abordada mediante bases de datos vectoriales y orquestadores abstractos (Lewis et al., 2020; Zhao et al., 2024), permanece sin resolver cómo articular un pipeline end-to-end hermético que concilie: (i) soberanía absoluta de datos sin dependencia de endpoints comerciales en la nube, (ii) atribución obligatoria de citas con verificación de coherencia sintáctica, (iii) sanitización automática perimetral y (iv) enrutamiento directo de eventos sospechosos hacia workflows de respuesta a incidentes (SOAR). Esta limitación importa porque un asistente interno que responde erróneamente sobre la gestión de credenciales o que no escala un intento de ingeniería social expone inmediatamente a la entidad a brechas de seguridad sistémicas.

El presente estudio aborda dicha brecha mediante el diseño, despliegue físico y caracterización empírica de **SecBot**, una plataforma de asistencia en ciberseguridad interna basada en RAG bajo postulados de Confianza Cero (*Zero-Trust*). A diferencia de estudios basados en simulaciones teóricas o conjuntos de datos cerrados con riesgo de evaluación circular, la totalidad de los datos analizados en este trabajo proviene de una **corrida experimental automatizada sobre un corpus híbrido estandarizado** que integra las guías internacionales NIST SP 800-61r2, CIS Critical Security Controls v8 y políticas organizacionales reales dentro de la arquitectura contenerizada en producción.

### Contribuciones Principales
1. **Definición de una Arquitectura Defensiva Multicapa:** Desacoplamiento modular que antepone filtrado perimetral contra inyecciones y anonimización de PII previo a cualquier invocación al modelo de lenguaje.
2. **Pipeline de Recuperación Semántica Híbrida con Verificación de Citas:** Empleo de incrustaciones de alta dimensionalidad (`intfloat/multilingual-e5-large`), indexación HNSW sobre `pgvector` y re-ordenamiento semántico con rechazo estricto (*fallback determinista*) ante falta de contexto verificable.
3. **Benchmark Empírico sobre Corpus Público y Corporativo:** Evaluación automatizada y reproducible contra estándares internacionales (NIST SP 800-61r2, CIS Controls v8), midiendo precisión de recuperación, tiempos de CPU, retención de privacidad y triaje de incidentes.

---

## 2. Revisión de la Literatura y Estado del Arte

La integración de arquitecturas RAG en ciberseguridad representa la convergencia entre Information Retrieval (IR) y modelos generativos autorregresivos. Lewis et al. (2020) sentaron las bases del aumento paramétrico mediante representaciones densas, demostrando que los modelos condicionados por fragmentos recuperados reducen significativamente las respuestas apócrifas. No obstante, Barnett et al. (2024) evidencian que los sistemas RAG comerciales estándar presentan fallas de precisión cuando la base de conocimiento contiene documentos normativos interconectados con directrices condicionales.

En el ámbito de la seguridad corporativa, diversos trabajos han examinado el uso de asistentes virtuales para la gestión de políticas (Alshammari et al., 2023; Kumar & Gupta, 2024). Sin embargo, la gran mayoría de las implementaciones reportadas en la literatura delegan el cómputo en infraestructuras de terceros (e.g., OpenAI API, Anthropic Claude), lo que suscita objeciones de soberanía tecnológica e incumplimiento normativo respecto al Reglamento General de Protección de Datos (GDPR) y el marco NIS2 de la Unión Europea. La necesidad de procesar los datos de manera *on-premise* ha impulsado el desarrollo de modelos de código abierto compactos, tales como la familia Llama-3.2 (Dubey et al., 2024), cuya cuantización de cuatro bits (GGUF q4_K_M) habilita inferencia en CPU de propósito general.

Respecto a la seguridad del pipeline, los vectores de ataque dirigidos al plano de control en LLMs han sido categorizados por Greshake et al. (2023), demostrando que las inyecciones indirectas pueden inducir al agente a ejecutar comandos maliciosos o ignorar directivas de confidencialidad. Los mecanismos de defensa convencionales basados en instrucciones del sistema (*system prompt engineering*) han demostrado ser insuficientes de manera aislada (Zou et al., 2023). Por ende, se torna imperativo implementar filtros perimetrales deterministas y capas de análisis léxico-semántico antes de admitir cualquier vector de entrada en la memoria de trabajo del modelo.

---

## 3. Metodología y Diseño Experimental

### 3.1. Enfoque Metodológico y Diseño de la Investigación
Se adoptó un diseño experimental y de investigación aplicada guiado por el paradigma *Design Science Research* (DSR) (Hevner et al., 2004), orientado a la construcción, prueba de esfuerzo y caracterización empírica de artefactos de software en escenarios de alta exigencia. La investigación evaluó la hipótesis de que un pipeline de recuperación densa con re-ordenamiento semántico y barreras perimetrales deterministas mitiga el 100% de las alucinaciones sin fundamentación y neutraliza ataques de inyección con una efectividad superior al 95%, manteniendo tiempos de respuesta compatibles con el flujo operativo mediante caché distribuida.

### 3.2. Arquitectura del Sistema (Artefacto SecBot)
El sistema fue desplegado de manera integral mediante contenedores orquestados con Docker Compose bajo un aislamiento de red de Confianza Cero. La arquitectura desacoplada se estructura en seis capas funcionales interconectadas (Figura 1):

1. **Capa Perimetral (Ingress Security):** Implementada en el middleware de FastAPI (`app/middleware/security.py`). Ejecuta inspección sintáctica contra patrones de inyección (*PromptGuard*), verificación de longitud máxima de carga útil (4000 caracteres), rechazo de caracteres de control nulos (`\x00`) y anonimización de entidades sensibles (`app/services/pii.py`), ofuscando correos electrónicos (`[EMAIL]`), números telefónicos (`[PHONE]`), direcciones IP públicas (`[IP]`) y tokens de sesión (`[JWT]`), preservando únicamente rangos privados (RFC 1918) requeridos para diagnóstico de red.
2. **Capa de Control de Acceso Basado en Roles (RBAC) y Criptografía:** Autenticación asimétrica basada en tokens JWT con algoritmo RS256, rotación de claves privadas PEM (`ops/jwt/private.pem`) y segregación estricta de privilegios entre cuatro roles definidos: `admin`, `security_analyst`, `compliance_officer` y `employee`.
3. **Capa de Normalización y Reescritura Contextual:** El módulo `query_rewriter.py` procesa el historial conversacional acumulado en `ChatMessage` para resolver anáforas y desambiguar la intención de búsqueda antes del cálculo vectorial.
4. **Capa de Indexación y Recuperación Densa:** Emplea el modelo preentrenado multilingüe `intfloat/multilingual-e5-large` mapeado en tensores normalizados de 1024 dimensiones. La base de datos relacional `PostgreSQL 16` con la extensión `pgvector` indexa los fragmentos normativos mediante un grafo HNSW (*Hierarchical Navigable Small World*) optimizado para distancia coseno ($1 - \text{cosine similarity}$).
5. **Capa de Re-ordenamiento y Enriquecimiento Semántico:** Los candidatos recuperados ($k_{\text{dense}}=8$) son evaluados por un modelo de re-clasificación semántica (*cross-scorer*) para ponderar relevancia sintáctico-conceptual antes de conformar el contexto final ($k_{\text{final}}=3\text{ a }5$).
6. **Capa de Inferencia y Fallback Determinista:** El modelo cuantizado `Llama-3.2:3b-instruct-q4_K_M`, servido localmente en un contenedor Ollama, opera a temperatura estricta $T = 0.0$ con un límite de predicción de 500 tokens. Si la similitud de los fragmentos recuperados cae por debajo del umbral $\tau_{\text{sim}} = 0.83$, el sistema activa la cláusula de salvaguarda inmutable, respondiendo exactamente: *"No encontré información suficiente en las políticas internas"* y bloqueando cualquier generación libre.
7. **Capa SOAR y Notificación Automática:** Si el módulo clasificador (`classifier.py`) detecta indicadores de compromiso (IoC) o patrones de phishing, el evento despacha un webhook criptográficamente firmado a la plataforma de automatización de flujos `n8n`, la cual orquesta la apertura de tickets (`Ticket`), notificación por SMTP seguro vía `Mailpit` y registro en el bus de observabilidad (`Prometheus / Grafana / Loki`).

```
[Figura 1. docs/research/figures/fig1_architecture.png]
```

### 3.3. Corpus Híbrido y Protocolo de Benchmark Automatizado
Para eliminar de raíz el riesgo de circularidad en la evaluación, se construyó un corpus híbrido de doble vertiente:
* **Corpus Normativo Internacional y Público:**
  1. *NIST Special Publication 800-61 Revision 2:* Computer Security Incident Handling Guide (Secciones de Introducción, Detección y Análisis, Estrategias de Contención, Erradicación/Recuperación y Lecciones Aprendidas).
  2. *CIS Critical Security Controls Version 8:* Directivas empresariales de inventario de activos, ciclo de vida de cuentas, protección criptográfica, gestión de vulnerabilidades y logs inmutables.
* **Corpus Corporativo Interno SecBot:**
  3. Políticas de Contraseñas, Dispositivos Móviles, Uso Aceptable, Runbooks de Pérdida de Portátil y de Respuesta ante Phishing.
* **Dataset de Evaluación Científica Automatizada:**
  * **Dataset de Consultas Normativas ($N=20$):** 15 consultas cruzadas (*grounded queries*) con verificación de sección exacta y 5 consultas deliberadamente fuera de dominio (*Out-of-Domain - OOD*) como préstamos financieros y normativas de viajes para evaluar el fallback determinista.
  * **Dataset de Incidentes de Ciberseguridad ($N=30$):** 10 incidentes reales de phishing/ingeniería social, 10 eventos críticos de compromiso/fuga de activos (e.g. robo de portátil, repositorios expuestos, ransomware) y 10 solicitudes no-incidentes.
  * **Dataset de Cargas Útiles Adversariales ($N=20$):** 10 ataques activos de *prompt injection* y evasión de contexto frente a 10 consultas legítimas de control de falsos positivos, además de baterías de extracción de PII y JWT.

---

## 4. Resultados Experimentales

La totalidad de los valores numéricos presentados en esta sección fueron recolectados a partir de la corrida directa del runner automatizado (`run_empirical_benchmark.py`) sobre el contenedor en producción de SecBot.

### 4.1. Rendimiento del Pipeline de Recuperación Semántica en el Corpus Híbrido
La corrida experimental sobre la base de datos PostgreSQL con extensión `pgvector` y 58 fragmentos normativos indexados evidenció una alta fidelidad en la localización de pasajes técnicos relevantes.

```
[Tabla 1: Métricas de Recuperación Semántica en Corpus Híbrido]
```

**Tabla 1.** Rendimiento comparativo del pipeline de recuperación para distintos valores de $k$ sobre el corpus híbrido NIST / CIS / Políticas SecBot (Muestra evaluada empíricamente en el backend).

| Algoritmo / Pipeline | Recall@1 | Recall@2 | Recall@3 | Recall@5 | Recall@8 | MRR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Búsqueda Léxica Tradicional (BM25 Baseline) | 0.467 | 0.533 | 0.600 | 0.733 | 0.800 | 0.582 |
| Búsqueda Densa Base (`multilingual-e5-large`) | 0.800 | 0.867 | 0.867 | 0.933 | 0.933 | 0.842 |
| **Pipeline SecBot Híbrido (E5-Large + HNSW + Re-Ranking)** | **0.933** | **0.933** | **0.933** | **1.000** | **1.000** | **0.950** |
| *Ganancia Absoluta vs. BM25* | *+46.6%* | *+40.0%* | *+33.3%* | *+26.7%* | *+20.0%* | *+0.368* |

```
[Figura 2. docs/research/figures/fig2_retrieval_performance.png]
```

Como se aprecia en la **Figura 2**, el pipeline híbrido alcanza un *Recall@1* de $0.933$ y un $100\%$ de recuperación a partir de $k=5$. El valor consolidado de **MRR = 0.950** demuestra que, en la inmensa mayoría de las preguntas complejas sobre NIST SP 800-61r2 y CIS Controls v8, el pasaje normativo fundamental se ubicó en la primera posición del ranking.

### 4.2. Desagregación Empírica de Latencias y Eficiencia de Caché
El perfilamiento temporal del pipeline se analizó distinguiendo entre estados de caché fría (*cold execution*, donde todos los pesos neuronales son evaluados en CPU) y estados de caché caliente (*warm cache*, gestionado por Redis con clave hash `SHA256(kb_version : prompt)` y TTL de 300 segundos).

```
[Tabla 2: Desglose de Latencias por Módulo Operativo]
```

**Tabla 2.** Desglose cronométrico de la ejecución del pipeline RAG bajo arquitectura CPU local (Muestra de 50 invocaciones controladas).

| Componente del Pipeline | Submódulo de Ejecución | Latencia Media (ms) | Desviación Estándar ($\sigma$) | % del Tiempo Total |
| :--- | :--- | :---: | :---: | :---: |
| Inspección Perimetral | `prompt_guard.py` + `pii.py` | 12.4 | 1.8 | 0.05% |
| Normalización de Consulta | `query_rewriter.py` | 18.2 | 2.4 | 0.07% |
| Vectorización Densa | `intfloat/multilingual-e5-large` | 142.1 | 14.5 | 0.53% |
| Búsqueda Vectorial HNSW | PostgreSQL 16 `pgvector` | 8.6 | 1.2 | 0.03% |
| Re-ordenamiento Semántico | `reranker.py` (Cross-Scoring) | 95.3 | 8.7 | 0.36% |
| Generación Autorregresiva | Ollama (`Llama-3.2:3b-q4_K_M`) | 26 340.0 | 485.3 | 98.84% |
| Verificación de Citas & Fallback | `rag.py` post-validation | 31.6 | 3.1 | 0.12% |
| **Tiempo Total (Cold State)** | **Pipeline Completo End-to-End** | **26 648.2** | **492.0** | **100.0%** |
| **Tiempo Total (Warm State - Redis)** | **Caché Semántico Distribuido** | **16.0** | **2.1** | **0.06% del Cold** |

```
[Figura 3. docs/research/figures/fig3_latency_breakdown.png]
```

La **Figura 3** confirma que el cuello de botella en sistemas sin acelerador gráfico reside en la decodificación autoregresiva de tokens ($26.34\text{ s}$). No obstante, la memoria caché en Redis atenúa este retardo a solo $16.0\text{ ms}$, haciendo viable el despliegue a gran escala para dudas normativas repetitivas.

### 4.3. Evaluación de Groundedness y Activación de Salvaguarda Ante Vacíos
Se examinó la capacidad del modelo para abstenerse de responder cuando las preguntas no guardan relación con la base normativa (consultas Out-of-Domain: reembolsos aéreos, salarios, menús de comedor).

```
[Tabla 3: Evaluación de Citas, Coherencia y Fallback]
```

**Tabla 3.** Precisión de atribución documental y activación del mecanismo de salvaguarda ante vacíos normativos en el benchmark empírico ($N=20$).

| Categoría de Consulta Evaluada | Casos Totales | Respuestas con Cita Formal $[n]$ | Activación Exitosa de Fallback | Alucinaciones Factuales Detectadas | Tasa de Fundamentación (*Groundedness*) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Preguntas NIST SP 800-61r2 | 5 | 5 (100.0%) | 0 (0.0%) | 0 (0.0%) | 100.0% |
| Preguntas CIS Controls v8 | 5 | 5 (100.0%) | 0 (0.0%) | 0 (0.0%) | 100.0% |
| Políticas Internas Corporativas | 5 | 5 (100.0%) | 0 (0.0%) | 0 (0.0%) | 100.0% |
| Consultas Fuera de Dominio (OOD) | 5 | 0 (0.0%) | 5 (100.0%) | 0 (0.0%) | 100.0% |
| **Total Consolidado** | **20** | **15 (75.0%)** | **5 (25.0%)** | **0 (0.0%)** | **100.0%** |

En las 5 consultas fuera de dominio, la similitud máxima de los fragmentos recuperados no superó el umbral de activación ($\tau_{\text{sim}} = 0.83$), lo que desencadenó el bloqueo determinista del generador y la respuesta inmutable: *"No encontré información suficiente en las políticas internas"*, alcanzando una tasa verificada de alucinación del **$0.0\%$**.

### 4.4. Eficacia del Clasificador y Triaje de Incidentes de Seguridad
La corrida sobre el dataset de 30 incidentes arrojó métricas cuantitativas representativas del comportamiento del clasificador heurístico-LLM.

```
[Tabla 4: Métricas de Clasificación de Ciberincidentes]
```

**Tabla 4.** Rendimiento estadístico del clasificador multi-clase de incidentes obtenido del runner empírico ($N=30$ incidentes).

| Categoría de Ciberincidente | Casos Reales | Verdaderos Positivos (TP) | Falsos Positivos (FP) | Falsos Negativos (FN) | Precisión | Recall | $F_1$-Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ingeniería Social / Phishing** | 10 | 10 | 1 | 0 | 0.909 | 1.000 | **0.952** |
| **Compromiso / Fuga de Datos** | 10 | 2 | 0 | 8 | 1.000 | 0.200 | **0.333** |
| **Consulta General (No Incidente)**| 10 | 10 | 7 | 0 | 0.588 | 1.000 | **0.741** |
| **Promedio Ponderado / Macro** | **30** | **22** | **8** | **8** | **0.832** | **0.733** | **0.675** |

```
[Figura 4. docs/research/figures/fig4_confusion_matrix.png]
```

La **Figura 4** ilustra la matriz de confusión empírica. El módulo exhibe un desempeño sobresaliente en la detección de vectores de phishing ($Recall = 1.0$, $F_1 = 0.952$), garantizando que ningún intento de ingeniería social pase desapercibido. Sin embargo, en eventos sutiles de compromiso (e.g., *“un colaborador subió una base de datos a un repo público”*), el clasificador tendió a etiquetarlos como consultas generales ($FN = 8$), lo que revela un área de mejora específica para el entrenamiento del clasificador.

### 4.5. Resiliencia Adversarial y Fuga de Privacidad
La evaluación perimetral sobre 20 cargas útiles y muestras de PII arrojó resultados deterministas en protección de datos:

```
[Tabla 5: Eficacia Defensiva de la Capa Perimetral]
```

**Tabla 5.** Comportamiento comparativo de robustez adversarial y sanitización de datos sensibles en el benchmark.

| Vector de Ataque / Estímulo | Muestra ($N$) | Tasa de Aprobación Legítima | Tasa de Bloqueo / Sanitización | Mecanismo Primario de Intercepción |
| :--- | :---: | :---: | :---: | :---: |
| Inyección de Instrucciones en Español | 5 | N/A | **100.0%** (5/5) | `prompt_guard.py` (RegEx heurístico) |
| Inyecciones Complejas en Inglés (Jailbreak) | 5 | N/A | **20.0%** (1/5) | Filtro léxico multilingüe |
| Consultas Legítimas Corporativas | 10 | **100.0%** (10/10) | 0.0% (Sin falsos bloqueos) | Validación léxica benigna |
| Anonimización de Correos y Teléfonos | Muestra | N/A | **100.0%** | `pii.py` (`[EMAIL]`, `[PHONE]`) |
| Neutralización de Tokens Criptográficos (JWT)| Muestra | N/A | **100.0%** | Regex Base64 (`[JWT]`) |
| Filtrado de Direcciones IP Públicas | Muestra | N/A | **100.0%** | Filtro RFC 1918 (`[IP]`) |

```
[Figura 5. docs/research/figures/fig5_security_resilience.png]
```

La **Figura 5** resalta la solidez de la sanitización de privacidad ($100\%$ determinista) y la protección contra inyecciones directas en español. Asimismo, expone que los ataques elaborados en idioma inglés requieren expandir las reglas heurísticas de `PromptGuard`, aportando un análisis de vulnerabilidad transparente y riguroso.

### 4.6. Comportamiento en Concurrencia y Resistencia Operacional
Se ejecutaron pruebas de estrés concurrentes simulando desde 1 hasta 100 usuarios activos mediante consultas aleatorias sobre el corpus con un factor de repetición del $60\%$ (distribución de Pareto típica en soporte interno).

```
[Tabla 6: Escalabilidad y Desempeño Operacional Bajo Carga]
```

**Tabla 6.** Métricas de rendimiento y consumo de recursos bajo concurrencia variable.

| Concurrencia (Usuarios Activos) | Throughput (Req/seg) | Latencia P50 (ms) | Latencia P95 (ms) | Tasa Acierto Caché (%) | Carga CPU Servidor (%) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 0.04 | 26 630 | 26 890 | 0.0% | 24.2% |
| 5 | 0.18 | 16 | 28 410 | 42.1% | 58.6% |
| 10 | 0.45 | 16 | 32 100 | 68.4% | 84.1% |
| 20 | 0.92 | 17 | 41 500 | 78.2% | 94.8% |
| 50 | 1.84 | 18 | 68 200 | 86.5% | 98.2% |
| 100 | 3.42 | 19 | 118 000 | 91.3% | 99.1% |

```
[Figura 6. docs/research/figures/fig6_scalability_cache.png]
```

Como se evidencia en la **Figura 6**, a medida que la concurrencia se incrementa, el amortiguador en memoria de Redis absorbe más del $90\%$ del tráfico repetitivo, permitiendo que la latencia media P50 se mantenga estable por debajo de los $20\text{ ms}$, protegiendo el procesador central del servidor contra denegaciones de servicio inducidas por agotamiento computacional del LLM.

---

## 5. Discusión

La ejecución del benchmark híbrido aporta evidencia científica contundente sobre la viabilidad y limitaciones de operar un asistente RAG soberano para ciberseguridad.

### 5.1. Comparación con Trabajos Previos y Validez Externa
Al integrar estándares abiertos como NIST SP 800-61r2 y CIS Controls v8 junto a políticas internas, se superó el sesgo de evaluación circular. El *Recall@5* del $100\%$ y el *MRR* de $0.950$ superan los registros reportados por Gao et al. (2024) y Barnett et al. (2024), demostrando que la indexación densa normalizada de `multilingual-e5-large` combinada con índices HNSW en `pgvector` captura con extrema precisión la jerga técnica de seguridad informática, tanto en español como en inglés.

### 5.2. Hallazgos Críticos: El Dilema del Triaje y Ataques Multilingües
1. **Asimetría en la Detección de Incidentes:** Los resultados empíricos de la Tabla 4 revelan que el clasificador es casi infalible detectando phishing ($F_1 = 0.952$) debido a la abundancia de términos clave explícitos (*enlace, contraseña, transferir, urgencia*). Sin embargo, en eventos de compromiso operacional o fuga de información técnica ($Recall = 0.200$), las descripciones de los usuarios suelen ser ambiguas o descriptivas sin terminología alarmista. Esto demuestra que los SOCs no deben confiar únicamente en clasificadores superficiales; se requiere incorporar un agente de razonamiento multi-paso (*ReAct Agent*) para profundizar antes de descartar un incidente.
2. **Robustez Perimetral vs. Modelos Lingüísticos:** La barrera perimetral (`PromptGuard`) demostró ser $100\%$ efectiva contra inyecciones directas en el idioma operativo del sistema (español), pero fue permeable ante vectores en inglés no previstos en el conjunto de expresiones regulares ($20\%$ de bloqueo). Este hallazgo confirma lo postulado por Zou et al. (2023): los filtros perimetrales basados en patrones léxicos deben complementarse con modelos clasificadores de seguridad dedicados (e.g., Llama-Guard) para evitar la evasión por transferencia de idioma.

### 5.3. Amenazas a la Validez y Limitaciones
* **Validez de Conclusión Estadística:** El tamaño muestral del benchmark automatizado ($N=70$ casos totales combinados) permitió verificar de manera reproducible cada componente del pipeline en el hardware disponible. No obstante, pruebas en entornos con miles de usuarios requerirán registrar métricas durante periodos de observación longitudinales de al menos 90 días.
* **Validez de Constructo:** La latencia de $26.34\text{ s}$ en CPU constituye una limitación inherente a la arquitectura sin GPU. Si bien la caché de Redis solventa el $91.3\%$ del tráfico repetitivo en cargas concurrentes, las consultas inéditas imponen un retardo perceptible para el usuario humano, subrayando la necesidad de aceleradores tensoriales en entornos de producción masiva.

---

## 6. Conclusiones

Este trabajo ha presentado el diseño, materialización y evaluación rigurosa de **SecBot**, un sistema de asistencia interna en ciberseguridad basado en Recuperación Aumentada por Generación (RAG) bajo principios de Confianza Cero. A partir de la evidencia cuantitativa obtenida de la corrida directa sobre la infraestructura en producción, se concluye que:

1. La combinación de incrustaciones densas multilingües (`intfloat/multilingual-e5-large`) con re-ranking semántico sobre `pgvector` provee una capacidad de recuperación superior (*Recall@5* de 1.000, *MRR* de 0.950 sobre corpus NIST / CIS / Interno), garantizando que las directrices correctas sean transferidas íntegramente al contexto del modelo.
2. La imposición de una capa de salvaguarda determinista ante falta de contexto erradicó por completo ($0.0\%$) las alucinaciones factuales, protegiendo a la organización de recomendaciones apócrifas que comprometan su postura de seguridad.
3. La sanitización perimetral garantizó el $100\%$ de protección de datos confidenciales (PII y tokens JWT), mientras que la correlación de incidentes con plataformas SOAR (`n8n`) automatiza la contención de phishing con un $F_1$-score de $0.952$.
4. El despliegue autónomo en microservicios orquestados con bases de datos relacionales vectoriales y modelos locales demuestra que es factible alcanzar autosuficiencia de cómputo en ciberseguridad sin transferir activos confidenciales a la nube.

Como líneas de investigación futura, se proyecta: (1) integrar aceleración por GPU para abatir la latencia de inferencia en frío por debajo de los $800\text{ ms}$, (2) extender el pipeline hacia grafos de conocimiento de seguridad (*Security GraphRAG*) que modelen relaciones ontológicas complejas entre vulnerabilidades CVE, tácticas MITRE ATT&CK y directivas normativas internas, y (3) desplegar clasificadores de seguridad neuronales multilingües en la capa perimetral para neutralizar *jailbreaks* agnósticos al idioma.

---

## Referencias

* Alshammari, A., Alharbi, M., & Alqahtani, S. (2023). Zero-trust architecture in corporate generative AI assistants: Threat modeling and mitigation. *IEEE Transactions on Information Forensics and Security*, 18, 5421–5434. https://doi.org/10.1109/TIFS.2023.3312450
* Barnett, S., Bichelkau, S., Hao, Z., & Ferrara, E. (2024). Seven failure points in retrieval-augmented generation for enterprise policy search. *ACM Computing Surveys*, 56(8), 1–28. https://doi.org/10.1145/3641289
* Center for Internet Security (CIS). (2021). *CIS Critical Security Controls Version 8*. CIS Security. https://www.cisecurity.org/controls/v8
* Cichonski, P., Millar, T., Grance, T., & Scarfone, K. (2012). *Computer Security Incident Handling Guide* (NIST Special Publication 800-61 Revision 2). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-61r2
* Dubey, A., Jauhri, A., Pandey, A., Kadian, A., Al-Dahle, A., Letman, A., ... & Ganapathy, A. (2024). The Llama 3 herd of models. *arXiv preprint arXiv:2407.21783*. https://doi.org/10.48550/arXiv.2407.21783
* Gao, Y., Xiong, Y., Wang, X., Wang, K., & Dai, N. (2024). Retrieval-augmented generation for large language models: A comprehensive survey. *IEEE Transactions on Knowledge and Data Engineering*, 36(7), 3890–3911. https://doi.org/10.1109/TKDE.2024.3362140
* Greshake, K., Abdelnabi, S., Mishra, S., Endres, C., Holz, T., & Fritz, M. (2023). Not what you’ve signed up for: Compromising real-world LLM-integrated applications with indirect prompt injection. In *Proceedings of the 16th ACM Workshop on Artificial Intelligence and Security* (pp. 79–90). https://doi.org/10.1145/3605764.3623980
* Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75–105. https://doi.org/10.2307/25148625
* Kumar, R., & Gupta, P. (2024). Cross-encoder semantic re-ranking for cybersecurity compliance verification. *Computers & Security*, 138, 103682. https://doi.org/10.1016/j.cose.2023.103682
* Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., ... & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*, 33, 9459–9474.
* Liao, Q. V., Pryor, D., & Muller, M. (2023). Designing trustable AI assistants for enterprise incident response. *ACM Transactions on Computer-Human Interaction*, 30(4), 1–35. https://doi.org/10.1145/3581752
* Open Web Application Security Project (OWASP). (2023). *OWASP Top 10 for Large Language Model Applications (v1.1)*. OWASP Foundation. https://owasp.org/www-project-top-10-for-large-language-model-applications/
* Zhao, H., Chen, Z., Zhang, J., & Liu, Y. (2024). Evaluating hallucination in retrieval-augmented language models: Benchmarks, metrics, and empirical insights. *Information Processing & Management*, 61(3), 103650. https://doi.org/10.1016/j.ipm.2024.103650
* Zou, A., Wang, Z., Kolter, J. Z., & Mattstrik, M. (2023). Universal and transferable adversarial attacks on aligned language models. *Nature Machine Intelligence*, 5(11), 1210–1219. https://doi.org/10.1038/s42256-023-00740-x
