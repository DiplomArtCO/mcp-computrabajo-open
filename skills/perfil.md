---
name: perfil
description: Consulta el perfil y los CV del candidato autenticado.
---

# Perfil y CV

Cuando la persona pregunte por su perfil, llama primero a `estado-de-sesion`.
Si falta sesión, explica que la búsqueda pública sigue disponible y que el
login local visible es necesario para datos privados. Con sesión usa
`ver-mi-perfil` y `listar-mis-cv`.

Nunca muestres cookies, tokens, contraseñas, campos ocultos ni credenciales.
No infieras datos que no estén en el perfil devuelto.
