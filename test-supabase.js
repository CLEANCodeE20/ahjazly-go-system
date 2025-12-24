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

console.log(`Connecting to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase.from('partners').select('*').limit(1);

if (error) {
    console.error("Connection Error:", error.message);
    process.exit(1);
} else {
    console.log("Connection Successful!");
    console.log("Data sample:", data);
}
