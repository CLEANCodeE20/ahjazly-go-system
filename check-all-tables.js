import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL="(.+)"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.+)"/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find credentials in .env");
    process.exit(1);
}

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];
const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
    'users',
    'partners',
    'trips',
    'bookings',
    'routes',
    'buses',
    'drivers',
    'employees',
    'passengers'
];

async function checkAllTables() {
    console.log("Checking Project Tables Integrity...");
    let allGood = true;

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`[-] Table '${table}': NOT FOUND or Access Denied (${error.message})`);
            allGood = false;
        } else {
            console.log(`[+] Table '${table}': Found and Accessible.`);
        }
    }

    if (allGood) {
        console.log("\nCONCLUSION: All core tables are present and connected. The project is ready for full operations.");
    } else {
        console.log("\nCONCLUSION: Some tables are missing. Please ensure you ran the full SQL export script.");
    }
}

checkAllTables();
