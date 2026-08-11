const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzkqtlympxxonafzjspd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6a3F0bHltcHh4b25hZnpqc3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5OTkzNSwiZXhwIjoyMTAxOTc1OTM1fQ.3cWSk0FoeOYPoUobakansFoDArNPitEeeqRYHTa4fMA';

const sb = createClient(supabaseUrl, serviceKey);

async function check() {
  // Check organizations
  const { data: orgs, error: orgError } = await sb.from('organizations').select('*');
  console.log('Organizations:', JSON.stringify(orgs, null, 2));
  if (orgError) console.log('Org Error:', orgError);

  // Check tenant_sites
  const { data: sites, error: siteError } = await sb.from('tenant_sites').select('*');
  console.log('Tenant Sites:', JSON.stringify(sites, null, 2));
  if (siteError) console.log('Site Error:', siteError);
  
  // Check profiles
  const { data: profiles, error: profError } = await sb.from('profiles').select('*');
  console.log('Profiles:', JSON.stringify(profiles, null, 2));
  if (profError) console.log('Profile Error:', profError);
}

check();
