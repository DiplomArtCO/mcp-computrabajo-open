# Guía para agentes: MCP de Computrabajo

## Propósito

Este repositorio contiene un servidor MCP para Computrabajo. Permite buscar
ofertas, consultar sus detalles, leer el perfil profesional autenticado,
listar CV adjuntos y gestionar postulaciones con preguntas de selección.

Repositorio publicado:

`https://github.com/DiplomArtCO/mcp-computrabajo-preguntas`

Repositorio remoto autorizado para commits y pushes:

`https://github.com/DiplomArtCO/mcp-computrabajo-preguntas`

Usar siempre el remoto `github-copy` para publicar cambios de este proyecto.
Los commits de producción deben publicarse en la rama `main`.

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
predeterminado es `co`.

## Experiencia de uso

El producto se usa exclusivamente mediante conversación en un cliente MCP.
No crear aplicaciones de escritorio, interfaces propias, launchers ni
instaladores como parte de este repositorio. El README debe ser la guía
principal para usuarios no técnicos.

Las skills conversacionales deben:

- Traducir lenguaje natural a las herramientas MCP apropiadas.
- Guiar búsqueda, detalle, perfil y CV sin exigir nombres técnicos.
- Consultar preguntas actuales antes de cualquier postulación.
- Presentar preguntas y respuestas para revisión humana.
- Exigir confirmación explícita antes de `apply-to-job`.
- Informar estados de sesión sin revelar cookies, tokens o credenciales.
- Para el conector remoto, recomendar `iniciar-sesion-remota`, que abre el
  navegador local y transfiere la sesión mediante un desafío efímero. No pedir
  cookies manualmente salvo como fallback técnico.

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

La sesión local preferida se administra mediante el navegador visible y el
almacén seguro del sistema implementados en `src/local-auth/`. No mostrar
cookies ni pedir al usuario que las copie. `CT_COOKIES` y `CT_COOKIES_FILE`
solo son fallback para usuarios técnicos.

El conector remoto no puede abrir un navegador ni leer el almacén seguro desde
Cloudflare Workers. `iniciar-sesion-remota` ejecuta un puente local que abre
Playwright, reclama un desafío de un solo uso en `OAUTH_KV` y envía la sesión
por HTTPS. Los desafíos expiran en cinco minutos, no se reutilizan y nunca se
registran cookies.

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

## Despliegue remoto desde GitHub

La producción debe desplegarse desde el repositorio personal:

`https://github.com/DiplomArtCO/mcp-computrabajo-preguntas`

El Worker previsto se llama `computrabajo-mcp` y debe exponerse mediante el
subdominio gratuito de Cloudflare:

`https://computrabajo-mcp.torres-sergio2205.workers.dev/mcp`

La configuración declarativa está en `wrangler.jsonc` y el pipeline está en
`.github/workflows/deploy-worker.yml`. El pipeline despliega únicamente desde
`main` después de pasar typecheck, tests y build. Requiere los secretos de
GitHub `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.

El namespace KV OAuth propio se configura mediante el binding `OAUTH_KV`.
Nunca reutilizar un ID de KV de otra cuenta ni guardar tokens de Cloudflare en
el repositorio. No anunciar la URL pública hasta que el Worker exista y se
hayan verificado handshake MCP, descubrimiento OAuth, herramientas públicas y
flujo autenticado.

Estado de la implementación al 2026-09-09:

- El workflow, la configuración del Worker y el cambio de OAuth están
  publicados en `main`.
- El namespace KV `computrabajo-mcp-oauth` fue creado.
- Tests, typecheck y build pasan localmente.
- El Worker `computrabajo-mcp` fue desplegado correctamente en Cloudflare
  Workers.
- La URL pública es
  `https://computrabajo-mcp.torres-sergio2205.workers.dev/mcp`.
- El despliegue verificó el binding `OAUTH_KV` con el namespace
  `5d366eb21b424183b6710392bc2164bb`.
- El OAuth remoto ahora ofrece autenticación automática mediante el puente
  local `iniciar-sesion-remota`. La persona usuaria ejecuta un único comando
  por autenticación; el puente abre Computrabajo, transfiere la sesión por
  HTTPS con un desafío efímero y se cierra después.
- El cambio del puente local está validado localmente, pero todavía requiere
  un nuevo despliegue del Worker antes de probarlo contra la URL pública.

Orden obligatorio para continuar:

1. Verificar que el workflow de `main` termine correctamente para activar el
   despliegue de producción mediante GitHub Actions.
2. Desplegar el cambio del puente OAuth y probarlo con un cliente nuevo.
3. Revisar logs sin exponer cookies, tokens, campos ocultos ni respuestas
   personales.

No usar una redirección HTTP simple como sustituto de la migración OAuth.
Mantener la URL anterior temporalmente solo si sigue bajo control y retirarla
después de validar el endpoint nuevo.



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