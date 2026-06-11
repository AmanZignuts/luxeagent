const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_tables'); // Or query pg_catalog
  if (error) {
    // If RPC get_tables doesn't exist, query pg_tables
    const { data: tables, error: tableError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    if (tableError) {
      console.log("Failed to query pg_tables, trying raw query via custom select or check schemas.");
      // Let's run a raw query using a known query or system views
      console.error(tableError);
    } else {
      console.log("Tables:", tables);
    }
  } else {
    console.log("Tables:", data);
  }
}
main();
