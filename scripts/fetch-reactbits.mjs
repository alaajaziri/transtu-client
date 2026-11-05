// Télécharge les composants React Bits utilisés par le site (https://github.com/DavidHDev/react-bits)
// dans src/reactbits/, à une version FIGÉE du dépôt (commit) pour que le résultat soit reproductible.
//
//   npm run reactbits            télécharge ce qui manque
//   npm run reactbits -- --force retélécharge tout
//
// Lancé automatiquement avant `npm run dev` et `npm run build` (scripts predev / prebuild).
// Licence : MIT + Commons Clause (utilisation dans un site / une application OK ; ne pas revendre les
// composants eux-mêmes). LICENSE.md est téléchargé à côté des fichiers.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SHA = '4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4';
const BASE = `https://raw.githubusercontent.com/DavidHDev/react-bits/${SHA}`;
const OUT = fileURLToPath(new URL('../src/reactbits/', import.meta.url));

const FILES = [
  ['src/content/Animations/AnimatedContent/AnimatedContent.jsx', 'AnimatedContent.jsx'], // apparition au défilement
  ['src/content/Animations/ClickSpark/ClickSpark.jsx', 'ClickSpark.jsx'],               // étincelles au clic
  ['src/content/TextAnimations/BlurText/BlurText.jsx', 'BlurText.jsx'],                 // texte qui se précise
  ['src/content/TextAnimations/CountUp/CountUp.jsx', 'CountUp.jsx'],                    // compteurs animés
  ['LICENSE.md', 'LICENSE.md'],
];

const force = process.argv.includes('--force');
const exists = (p) => access(p).then(() => true, () => false);

await mkdir(OUT, { recursive: true });
let fetched = 0;
for (const [remote, local] of FILES) {
  const dest = path.join(OUT, local);
  if (!force && (await exists(dest))) continue;
  try {
    const res = await fetch(`${BASE}/${remote}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(dest, await res.text(), 'utf8');
    fetched++;
    console.log('  ✓ React Bits :', local);
  } catch (e) {
    console.error(`\n✗ Impossible de télécharger ${local} (${e.message || e}).`);
    console.error('  Vérifiez votre connexion Internet puis relancez : npm run reactbits\n');
    process.exit(1);
  }
}
if (!fetched) console.log('React Bits : composants déjà présents (src/reactbits/).');
