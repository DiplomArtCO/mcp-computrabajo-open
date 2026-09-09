# MCP Computrabajo

Servidor MCP para Computrabajo, la bolsa de empleo más grande de Latinoamérica: busca ofertas, lee la publicación completa, consulta tu propio CV y postula.

[![NPM Version](https://img.shields.io/npm/v/mcp-computrabajo?style=flat&logo=npm&logoColor=red)](https://www.npmjs.com/package/mcp-computrabajo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Documentación en español**

## Experiencia conversacional

El uso cotidiano ocurre en un cliente MCP compatible, mediante chat y sin
consola. Consulta el [onboarding paso a paso](ONBOARDING.md) para conectar,
iniciar sesión localmente una sola vez y resolver problemas.

Ejemplos: “Busca ofertas de SST en Cali”, “revisa mi perfil” o “muéstrame las
preguntas de esta oferta”. El asistente siempre consulta las preguntas actuales
y solicita confirmación explícita antes de postular.

Al instalar el paquete, las skills conversacionales quedan disponibles para
clientes con soporte de skills, como Claude Code, Cursor y Codex. En Claude
Code se instalan automáticamente en `~/.claude/skills/`; en Cursor, Codex u
otros clientes deben copiarse o registrarse según el directorio de skills que
utilice cada cliente. El paquete también las publica en `skills/*.md` para
facilitar esa instalación.

Los nombres disponibles son `/buscar-ofertas`, `/detalle-de-oferta`,
`/preguntas-de-postulacion`, `/postular-a-oferta`, `/ver-mi-perfil`,
`/listar-mis-cv` y `/estado-de-sesion`. Desactiva la instalación automática
con `CT_INSTALL_SKILLS=0`. Si el cliente no admite skills, usa estas mismas
capacidades mediante chat y las herramientas MCP.

## Conectar

El servidor remoto se despliega desde este repositorio en Cloudflare Workers.
La URL de producción usa el subdominio gratuito de Cloudflare:
`https://computrabajo-mcp.torres-sergio2205.workers.dev/mcp`.

**Claude Desktop y claude.ai** — Configuración → Conectores → Agregar conector personalizado:

```
https://computrabajo-mcp.torres-sergio2205.workers.dev/mcp
```

**Claude Code**

```bash
claude mcp add --transport http computrabajo https://computrabajo-mcp.torres-sergio2205.workers.dev/mcp
```

Al conectar se abre una página de autorización. Para autenticarte sin copiar
cookies, ejecuta en otra terminal:

```bash
npx mcp-computrabajo@latest iniciar-sesion-remota
```

Después pulsa **Iniciar sesión automáticamente** en la página OAuth y
completa el acceso en la ventana visible de Computrabajo. La sesión se
transfiere cifrada por HTTPS mediante un desafío de un solo uso; el puente
local no imprime ni muestra la cookie. Elige **Solo buscar** para conectarte
sin sesión.

La opción de pegar una cookie completa se conserva únicamente como fallback
para usuarios técnicos. La cookie se guarda cifrada y asociada únicamente a
esa conexión, y se descarta cuando la desconectas.

Para obtenerla: inicia sesión en Computrabajo, abre DevTools → Network, haz clic
derecho en cualquier petición → Copiar como cURL, y copia el valor después de
`-b`. Quien tenga esa cookie puede actuar como tú, así que pega solo una que
hayas generado tú.

## Cómo se ve

> **Tú:** Busca trabajos de backend en Lima que realmente encajen con mi CV.

> **Claude:** Tu CV es Full Stack — Rust, TypeScript, Angular, SQL Server, cuatro años. De las 20 vacantes en Lima, 6 calzan. La más cercana es Arquitecto de Software en EDPYME Inversiones La Cruz, publicada hace 2 horas, híbrido en San Isidro. ¿Te muestro la publicación completa?

> **Tú:** Sí, ¿y cuánto paga?

> **Claude:** No indica sueldo. Pide 5 años y título en sistemas — tienes el título, te falta un año de experiencia. 2 vacantes, contrato indefinido.

> **Tú:** Postula.

> **Claude:** Eso envía MI_CV.pdf, tu CV predeterminado, y no se puede deshacer. ¿Confirmas?

## Herramientas

| Herramienta | Qué hace | Recibe |
|-------------|----------|--------|
| `buscar-ofertas` | Busca ofertas por palabra clave y ubicación | `keyword`, `location?`, `country?`, `page?` |
| `detalle-de-oferta` | Publicación completa: descripción, sueldo, beneficios, empresa | `offerId`, `country?` |
| `ver-mi-perfil` | Tu CV: resumen, experiencia, estudios, idiomas, habilidades | `country?` |
| `listar-mis-cv` | Tus CVs en Word/PDF subidos y cuál es el predeterminado | `country?` |
| `preguntas-de-postulacion` | Lee las preguntas y opciones actuales sin postular | `offerId`, `country?` |
| `postular-a-oferta` | Envía tu CV y respuestas validadas a una oferta | `offerId`, `country?`, `answers?` |

`ver-mi-perfil`, `listar-mis-cv` y `postular-a-oferta` necesitan la cookie de
sesión; buscar no. `country` es uno de `pe`, `co`, `mx`, `ar`, `cl`, `ec` y por
defecto es `co`.

### Preguntas de selección

Primero consulta `preguntas-de-postulacion`. La herramienta no envía la
postulación y devuelve las preguntas, sus `questionId`, controles, opciones
válidas y campos ocultos dinámicos. Después de revisar la oferta y las
respuestas con la persona usuaria, llama a `postular-a-oferta` con:

```json
{
  "offerId": "ID_DE_32_CARACTERES",
  "country": "co",
  "answers": [
    { "questionId": "availability", "answer": "immediate" },
    { "questionId": "languages", "answer": ["es", "en"] }
  ]
}
```

El servidor comprueba que cada pregunta pertenezca al formulario actual, que
las opciones existan, que no haya respuestas duplicadas y que las preguntas
obligatorias estén contestadas. La confirmación humana debe ocurrir antes de
la llamada de escritura. No se inventan respuestas ni se evaden CAPTCHA,
antifraude, autenticación o límites de la plataforma.

Las palabras clave y ubicaciones son slugs en minúscula con guiones —
`desarrollador-de-software`, `la-libertad-en-trujillo`. Computrabajo compara la
palabra clave contra el título del puesto, así que la redacción importa: para
roles técnicos usa `desarrollador-...`, `programador`, `analista-programador` o
un sustantivo suelto como `software`. Evita `ingeniero-de-software` — en
Latinoamérica esa forma trae avisos de civil, mecánica y minería.

## Ejecutarlo tú mismo

El paquete de npm publica el mismo servidor por stdio:

```bash
claude mcp add computrabajo --env CT_COOKIES="<tu cookie>" -- npx mcp-computrabajo@latest
```

### MCP local sin copiar cookies

Para iniciar sesión de forma asistida en una ventana visible del navegador:

```bash
npx mcp-computrabajo@latest iniciar-sesion
npx mcp-computrabajo@latest
```

Completa el inicio de sesión directamente en Computrabajo. El agente no recibe
ni almacena tu contraseña, y guarda la sesión en el almacén seguro del sistema
operativo. Después configura tu cliente MCP para ejecutar:

```bash
npx mcp-computrabajo@latest
```

Comandos disponibles:

```bash
npx mcp-computrabajo@latest status
npx mcp-computrabajo@latest logout
```

El flujo local es independiente del conector remoto. Para el conector remoto
usa `iniciar-sesion-remota`. `CT_COOKIES` y
`CT_COOKIES_FILE` siguen disponibles como alternativas para usuarios técnicos.

| Variable | Default | Descripción |
|----------|---------|-------------|
| `CT_COOKIES` | — | Cadena de cookies de tu sesión del navegador |
| `CT_COOKIES_FILE` | `~/.computrabajo/cookies.txt` | Archivo con la cookie, como alternativa |
| `CT_COUNTRY` | `co` | Código de país por defecto |

## Desarrollo

```bash
bun install
bun run typecheck      # ambas entradas: stdio y Worker
bun test
bun run inspect        # MCP Inspector contra el servidor stdio
bun run dev:worker     # Worker en http://localhost:8787/mcp
bun run deploy         # requiere `wrangler login`
```

Los pushes a `master` ejecutan las validaciones y despliegan el Worker mediante
`.github/workflows/deploy-worker.yml`. El repositorio necesita los secretos
`CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` configurados en GitHub.

Solo la primera vez — crea el namespace de KV que respalda los permisos OAuth y
coloca su id en `wrangler.jsonc`:

```bash
bunx wrangler kv namespace create OAUTH_KV
```

## Migrar desde 0.x

La v1.0.0 trae cambios incompatibles: los resultados vienen envueltos
(`{ jobs: [...] }`, `{ job: {...} }`) y se exponen como `structuredContent` de
MCP; `country` es un enum en vez de una cadena libre; el servidor está construido
sobre el SDK v2 de MCP; y desaparecen el envoltorio `Tool`, `findPackageJson` y
los helpers `api.getCookies()`. Los nombres de las herramientas y las variables
de entorno no cambian.

`postular-a-oferta` además ahora reporta con honestidad. La 0.x devolvía
`success: true` ante cualquier HTTP 2xx, incluso cuando Computrabajo había
rechazado la postulación; ahora solo reporta éxito con el código `OfferAppliedOk`
del propio sitio.

## Licencia

MIT — ver [LICENSE](LICENSE). Sin afiliación con Computrabajo. Dudas y
problemas: [GitHub Issues](https://github.com/DiplomArtCO/mcp-computrabajo-preguntas/issues).
