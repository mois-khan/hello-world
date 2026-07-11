import { seedDatabase } from './src/lib/seed'; seedDatabase().then(() => console.log('Seeded!')).catch(console.error);
