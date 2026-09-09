import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(packageRoot, "skills");
const configRoot = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
const targetRoot = join(configRoot, "skills");
const manifestPath = join(targetRoot, ".mcp-computrabajo.json");
const marker = "<!-- Managed by mcp-computrabajo. Do not edit this line. -->";

if (process.env.CT_INSTALL_SKILLS === "0") {
  console.warn(
    "mcp-computrabajo: skill installation skipped (CT_INSTALL_SKILLS=0).",
  );
  process.exit(0);
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return { files: [] };
  }
}

async function install() {
  const entries = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);

  await mkdir(targetRoot, { recursive: true });
  const installed = [];

  for (const entry of entries) {
    const source = join(sourceRoot, entry);
    const skillName = entry.slice(0, -3);
    const targetDir = join(targetRoot, skillName);
    const target = join(targetDir, "SKILL.md");
    let existing = "";
    try {
      existing = await readFile(target, "utf8");
    } catch {}

    if (existing && !existing.includes(marker)) {
      console.warn(`mcp-computrabajo: preserving existing ${target}`);
      continue;
    }

    await mkdir(targetDir, { recursive: true });
    const content = await readFile(source, "utf8");
    await writeFile(target, `${marker}\n${content}`, "utf8");
    installed.push(target);
  }

  await writeFile(
    manifestPath,
    JSON.stringify({ package: "mcp-computrabajo", files: installed }, null, 2),
    "utf8",
  );
  console.log(`mcp-computrabajo: installed ${installed.length} Claude skills.`);
}

async function uninstall() {
  const manifest = await readManifest();
  for (const file of manifest.files || []) {
    try {
      const content = await readFile(file, "utf8");
      if (content.includes(marker)) {
        await rm(dirname(file), { recursive: true, force: true });
      }
    } catch {}
  }
  await rm(manifestPath, { force: true });
  console.log("mcp-computrabajo: managed Claude skills removed.");
}

if (process.argv.includes("--uninstall")) {
  await uninstall();
} else {
  await install();
}
