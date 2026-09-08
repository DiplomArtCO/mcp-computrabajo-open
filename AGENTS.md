# Guía para agentes: MCP de Computrabajo

## Propósito

Este repositorio contiene un servidor MCP para Computrabajo. Permite buscar
ofertas, consultar sus detalles, leer el perfil profesional autenticado,
listar CV adjuntos y gestionar postulaciones con preguntas de selección.

Repositorio publicado:

`https://github.com/DiplomArtCO/mcp-computrabajo-preguntas`

## Herramientas MCP


| Herramienta                 | Función                                                               | Requiere sesión |
| --------------------------- | --------------------------------------------------------------------- | --------------- |
| `search-jobs`               | Busca ofertas por palabra clave, ubicación y país                     | No              |
| `get-job-detail`            | Obtiene descripción, requisitos, empresa y beneficios                 | No              |
| `get-profile`               | Lee el perfil profesional autenticado                                 | Sí              |
| `list-attached-cvs`         | Lista CV adjuntos y marca el predeterminado                           | Sí              |
| `get-application-questions` | Consulta preguntas, opciones y campos dinámicos sin enviar respuestas | Sí              |
| `apply-to-job`              | Envía una postulación con respuestas validadas                        | Sí              |


Países admitidos: `pe`, `co`, `mx`, `ar`, `cl` y `ec`. El valor
predeterminado es `pe`.

## Flujo de postulación

```text
search-jobs
  -> get-job-detail
  -> get-application-questions
  -> revisión humana de preguntas y respuestas
  -> apply-to-job con answers
  -> resultado semántico
```

`apply-to-job` acepta:

```json
{
  "offerId": "ID_DE_32_CARACTERES",
  "country": "co",
  "answers": [
    {
      "questionId": "70971760",
      "answer": "Respuesta de texto"
    },
    {
      "questionId": "70971767",
      "answer": "0"
    }
  ]
}
```

Las preguntas deben consultarse inmediatamente antes del envío. Los
`questionId`, nombres de campo, opciones y tokens ocultos son dinámicos y no
deben reutilizarse entre ofertas ni sesiones.

## Contrato real de preguntas

La primera solicitud a `/candidate/apply/` puede responder con:

```json
{
  "result": "OfferHasKQ",
  "html": "..."
}
```

El HTML contiene:

- Campos ocultos como `__RequestVerificationToken`, `EncryptedCvId`,
`EncryptedOfferId` y `EncryptedCandidateId`.
- Preguntas `KillerQuestions[n]`.
- Preguntas abiertas en `KillerQuestions[n].OpenQuestion`.
- Preguntas cerradas en `KillerQuestions[n].ClosedQuestion`.
- Opciones en `KillerQuestions[n].DataOptions[n]`.
- URL final en `data-href-offer-apply`, normalmente
`/candidate/kq/apply`.

El adaptador HTTP analiza ese HTML y conserva los campos ocultos necesarios
para el segundo POST.

## Validaciones antes de enviar

El servidor debe comprobar que:

- Cada `questionId` pertenece al formulario recién consultado.
- No existen respuestas duplicadas.
- Todas las preguntas obligatorias tienen respuesta.
- Las opciones seleccionadas pertenecen a las opciones recibidas.
- No se envían campos desconocidos.
- La sesión sigue vigente.
- La persona usuaria confirmó explícitamente las respuestas y la oferta.

No se deben enviar respuestas genéricas, afirmativas o inventadas.

## Evidencia del candidato

Para respuestas laborales utilizar únicamente:

`D:\Paola Mojica\Bot_Postulaciones\CV_REFERENCE.md`

Clasificar cada pregunta como:

- `cv_supported`: está respaldada por el CV.
- `user_confirmation`: requiere un dato o preferencia confirmada por la persona.
- `unsupported`: no existe evidencia suficiente.
- `unsafe_to_assume`: responder afirmativamente podría falsear información.

No asumir salario, transporte, vehículo, residencia, barrio, disponibilidad,
viajes, idiomas, antecedentes, autorizaciones ni condiciones laborales.

## Procesamiento masivo

Para procesar ofertas de:

`D:\Paola Mojica\Bot_Postulaciones\ofertas_sst_valle.md`

usar este orden:

1. Leer y validar el `offerId`.
2. Consultar el detalle actual.
3. Consultar las preguntas reales.
4. Preparar respuestas con evidencia.
5. Presentar todas las respuestas pendientes para confirmación humana.
6. Enviar únicamente las ofertas confirmadas.
7. Procesar una oferta a la vez; nunca paralelizar postulaciones.
8. Registrar resultados semánticos sin datos sensibles.

Estados esperados:

- `submitted`
- `already_applied`
- `needs_review`
- `expired`
- `session_expired`
- `error`



## Seguridad

- Nunca registrar cookies, contraseñas, tokens CSRF ni campos ocultos.
- No guardar capturas HAR o cURL con credenciales dentro del repositorio.
- No evadir CAPTCHA, antifraude, autenticación ni límites de frecuencia.
- Detenerse ante `403`, CAPTCHA, antifraude o una respuesta ambigua.
- No reintentar automáticamente una solicitud de postulación.
- Una respuesta HTTP 200 no significa que la postulación fue enviada.
- La postulación es irreversible y requiere confirmación humana.

La sesión local esperada está en:

`C:\Users\storr\.computrabajo\cookies.txt`

El archivo debe contener únicamente el valor de la cabecera `Cookie`, no el
comando cURL completo. Nunca mostrar su contenido.

## Desarrollo local

Requisitos:

- Bun.
- Node.js/npm para instalar dependencias si Bun no está disponible.
- Una sesión de Computrabajo solo para pruebas autenticadas.

Comandos principales:

```bash
bun install
bun test
bun run typecheck
bun run build
bun run format
```

Si Bun no está instalado:

```bash
npm install
npm exec --yes bun -- test
npm exec --yes bun -- run typecheck
npm exec --yes bun -- run build
```



## Tests

Los tests deben usar fixtures anonimizados o mocks. Deben cubrir como mínimo:

- Oferta sin preguntas.
- Preguntas abiertas.
- Selección simple y múltiple.
- Campos ocultos dinámicos.
- Pregunta obligatoria sin respuesta.
- `questionId` inválido.
- Opción inválida.
- Respuestas duplicadas.
- Oferta ya aplicada.
- Oferta cerrada.
- Sesión expirada.
- `OfferHasKQ`.
- Compatibilidad con el flujo anterior.

Antes de entregar cambios, ejecutar tests, typecheck, build y revisión de
diff. No incluir cookies, perfiles reales ni respuestas personales en fixtures.

## Criterios para nuevos agentes

Antes de modificar el adaptador HTTP, revisar:

- `src/infrastructure/http/computrabajo-http.repository.ts`
- `src/domain/ports/computrabajo.repository.ts`
- `src/domain/models/computrabajo.model.ts`
- `src/infrastructure/mcp/tools/job/get-application-questions.ts`
- `src/infrastructure/mcp/tools/job/apply-to-job.ts`
- `tests/infrastructure/repository.test.ts`

Si Computrabajo cambia el contrato, capturar localmente la respuesta sin
compartir cookies, agregar un fixture anonimizado, actualizar el parser y
añadir una prueba de regresión antes de modificar el flujo de envío.



## Uso obligatorio de Graphify

Si existe `graphify-out/graph.json`, usar primero el grafo mediante

`graphify query` para responder preguntas sobre arquitectura, relaciones,

flujos o contenido del repositorio. No reconstruir el grafo ni leer archivos

masivamente salvo que el grafo no contenga la información necesaria.