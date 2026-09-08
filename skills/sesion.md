# Sesión

Llama a `estado-de-sesion` cuando la persona pregunte si está conectada o
falle una operación autenticada. Informa solo `authenticated` o `missing`.
Ante una sesión expirada, detén el flujo y solicita repetir el login local.

Nunca solicites cookies copiadas, imprimas secretos ni reintentes una
postulación automáticamente.
