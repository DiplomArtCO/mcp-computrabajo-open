import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skills = [
  "buscar-ofertas",
  "detalle-de-oferta",
  "preguntas-de-postulacion",
  "postular-a-oferta",
  "ver-mi-perfil",
  "listar-mis-cv",
  "estado-de-sesion",
];

test("every MCP operation has an invocable skill", async () => {
  for (const name of skills) {
    const content = await readFile(join(root, "skills", `${name}.md`), "utf8");
    expect(content).toContain(`name: ${name}`);
    expect(content).toContain("---");
  }
});

test("the installer is packaged and supports safe opt-out", async () => {
  const packageJson = await readFile(join(root, "package.json"), "utf8");
  const installer = await readFile(
    join(root, "scripts", "install-skills.mjs"),
    "utf8",
  );

  expect(packageJson).toContain(
    '"postinstall": "node scripts/install-skills.mjs"',
  );
  expect(packageJson).toContain('"scripts/install-skills.mjs"');
  expect(installer).toContain("CT_INSTALL_SKILLS");
  expect(installer).toContain("--uninstall");
  expect(installer).toContain("CLAUDE_CONFIG_DIR");
});
