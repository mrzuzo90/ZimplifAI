const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzkqtlympxxonafzjspd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6a3F0bHltcHh4b25hZnpqc3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5OTkzNSwiZXhwIjoyMTAxOTc1OTM1fQ.3cWSk0FoeOYPoUobakansFoDArNPitEeeqRYHTa4fMA';

const sb = createClient(supabaseUrl, serviceKey);

async function check() {
  // Check tenant_sites schema by selecting all columns
  const { data: sites, error: siteError } = await sb.from('tenant_sites').select('*').limit(1);
  console.log('Tenant Sites sample:', JSON.stringify(sites, null, 2));
  if (siteError) console.log('Site Error:', siteError);
}

check();
