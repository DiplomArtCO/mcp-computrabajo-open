# Usar Computrabajo conversando

## Conectar sin consola durante el uso normal

En Claude Desktop, claude.ai u otro cliente MCP compatible, abre la sección
de conectores y agrega:

`https://mcp-computrabajo.georgegiosue.dev/mcp`

Después escribe en el chat, por ejemplo:

- “Busca ofertas de SST en Cali.”
- “Muéstrame el detalle de la segunda oferta.”
- “¿Puedes revisar mi perfil y mis CV?”

La búsqueda y los detalles públicos funcionan sin sesión. Para perfil, CV,
preguntas de selección y postulaciones se necesita una sesión local.

## Primer inicio de sesión local

La única operación excepcional que puede requerir terminal es el primer
inicio de sesión, porque Computrabajo no ofrece OAuth público para candidatos:

1. Instala Node.js.
2. Ejecuta `npx mcp-computrabajo@latest iniciar-sesion`.
3. Si Chromium no está instalado, confirma su descarga cuando el programa lo solicite.
4. Completa el acceso manualmente en la ventana visible de Computrabajo.
5. Cierra la ventana cuando el mensaje indique que la sesión fue guardada.
6. Conecta el MCP local en tu cliente:
   `npx mcp-computrabajo@latest`.

La contraseña, CAPTCHA y MFA los gestiona la persona directamente en el
navegador. La sesión se guarda en el almacén seguro del sistema operativo.
Nunca pegues contraseñas, cookies ni tokens en el chat.

## Uso y diagnóstico

Pregunta “¿mi sesión está activa?” para usar `estado-de-sesion`. Si informa
`missing` o `session_expired`, repite el login local. El cliente debe detenerse
ante CAPTCHA, antifraude, 403 o una respuesta ambigua.

## Postular de forma segura

Di “quiero postular a [oferta]”. El asistente debe mostrar primero el detalle,
consultar las preguntas actuales, proponer respuestas y pedir confirmación
explícita con la oferta y las respuestas exactas. Una postulación no se puede
deshacer y nunca se envían respuestas inventadas.

## Solución de problemas

- **No se conecta:** actualiza el cliente MCP y verifica que la URL sea la
  oficial indicada arriba.
- **Sesión ausente o expirada:** ejecuta de nuevo el login visible.
- **CAPTCHA, MFA o antifraude:** completa el paso manual en Computrabajo y no
  pidas al asistente que lo evada.
- **Oferta cerrada o ya postulada:** el asistente lo reportará como
  `expired` o `already_applied`; no reintentes automáticamente.

Las variables `CT_COOKIES` y `CT_COOKIES_FILE` quedan disponibles únicamente
como fallback para usuarios técnicos.
