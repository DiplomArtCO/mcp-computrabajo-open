# Despliegue de Computrabajo Open MCP

Esta distribución es mantenida y publicada por Sergio Torres. El proyecto
conserva la licencia MIT original y no es afiliado con Computrabajo. Se publica
como un paquete npm independiente (`mcp-computrabajo-open`), basado en la
versión mejorada del MCP original; no requiere acceso a la cuenta propietaria
del paquete original.

Repositorio: https://github.com/DiplomArtCO/mcp-computrabajo-open

## Recursos que debe crear el propietario

Antes de desplegar, crea en una cuenta propia:

1. Un repositorio GitHub para este código.
2. Una cuenta npm propia con 2FA para publicar el paquete independiente
   `mcp-computrabajo-open`.
3. Un Worker de producción y otro de staging.
4. Un namespace KV OAuth distinto para cada Worker.
5. Un subdominio controlado por el propietario.

No reutilices el namespace KV ni el endpoint del proyecto anterior.

## Configuración local

Reemplaza el marcador del archivo `wrangler.jsonc` por el ID del namespace KV
de producción. Para staging, usa una copia de la configuración con otro nombre
de Worker y otro ID KV:

```powershell
bun install --frozen-lockfile
bun test
bun run typecheck
bun run build
bunx wrangler deploy --dry-run
```

El puente de sesión remota debe recibir la URL del Worker propio mediante
`CT_REMOTE_SERVER`. Nunca registres cookies, tokens, headers privados ni
campos ocultos.

## Secretos de GitHub Actions

Configura estos secretos en el repositorio propio, sin escribirlos en archivos:

- `CLOUDFLARE_API_TOKEN`: token limitado al despliegue del Worker.
- `CLOUDFLARE_ACCOUNT_ID`: cuenta Cloudflare propietaria.

El workflow de npm se activa con tags `v*.*.*` y usa Trusted Publishing de npm
mediante OIDC; no requiere guardar un `NPM_TOKEN`. En la configuración del
paquete npm, agrega como Trusted Publisher el repositorio
`DiplomArtCO/mcp-computrabajo-open`, el workflow
`.github/workflows/publish-npm.yml` y el entorno GitHub Actions. El workflow de
Cloudflare se activa con pushes a `main`.

## Publicación

```powershell
npm view mcp-computrabajo-open version
npm publish --access public
```

La primera publicación de `1.0.1` se hizo manualmente con 2FA. Las siguientes
versiones deben publicarse creando un tag `vX.Y.Z` en `main`, para que actúe el
workflow de Trusted Publishing. No es necesario pertenecer ni tener acceso al
paquete npm original.
