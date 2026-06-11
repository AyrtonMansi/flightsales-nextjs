// Run one tick locally without waiting for cron:  npm run tick:local
import { tick } from "../lib/orchestrator";
tick().then((r) => { console.log(r); process.exit(0); });
