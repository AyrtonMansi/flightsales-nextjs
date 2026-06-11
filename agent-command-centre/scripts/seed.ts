// Seed the world model with watch items + cadence, so the loop has interests on first tick.
// Edit these to taste, then:  npm run seed
import { updateWorldModel, getWorldModel } from "../lib/store";

const watch_items = [
  "EPM 18615 North Queensland gold resource / JORC updates",
  "Savannah Goldfields ASX announcements",
  "Etheridge Forsayth Percyville goldfield mining news",
  "gold price AUD per ounce",
  "modular CIL gold plant equipment availability Australia",
];

(async () => {
  const wm = await getWorldModel();
  await updateWorldModel({ ...wm, watch_items, watch_interval_min: 60, untriaged: wm.untriaged ?? [] });
  console.log("seeded world model with", watch_items.length, "watch items");
  process.exit(0);
})();
