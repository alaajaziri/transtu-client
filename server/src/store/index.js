// Point d'entrée UNIQUE de la couche données.
// Pour brancher la vraie base : créez ./mongoStore.js (ou sqlStore.js) qui respecte
// l'interface décrite dans jsonStore.js, puis changez la ligne ci-dessous.
import { createJsonStore } from './jsonStore.js';

export const store = createJsonStore();
