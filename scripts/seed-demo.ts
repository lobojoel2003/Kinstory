// Creates the fictional demo family (Rosa Delgado and six stories) in the
// database named by DATABASE_URL, so you can explore Kinstory with content.
//
//   npm run seed:demo
//
// Sign in afterwards as demo@kinstory.local / kinstory-demo.

import { closeDb, db } from '../src/lib/server/db.ts';
import { seedDemo } from '../src/lib/server/demo/seed.ts';
import { migrate } from '../src/lib/server/migrate.ts';

await migrate(db());
const result = await seedDemo(db());
if (result) {
	console.log(`Demo family created. Sign in as ${result.email} / ${result.password}`);
	console.log(`Open the book at /p/${result.projectId}/book and press “Save & typeset”.`);
} else {
	console.log('The demo account already exists; nothing to do.');
}
await closeDb();
