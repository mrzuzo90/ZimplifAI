const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzkqtlympxxonafzjspd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6a3F0bHltcHh4b25hZnpqc3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5OTkzNSwiZXhwIjoyMTAxOTc1OTM1fQ.3cWSk0FoeOYPoUobakansFoDArNPitEeeqRYHTa4fMA';

const sb = createClient(supabaseUrl, serviceKey);

async function check() {
  // Try inserting with only required columns - check what the schema is
  const { data: sites, error: siteError } = await sb.from('tenant_sites').upsert([
    {
      organization_id: '034b6723-c887-43fe-a882-ab6cb1ae0e0a',
      slug: 'brasa-carbon',
      vertical_type: 'restaurant_booking',
      primary_color: '#D93F3F',
      is_published: true
    },
    {
      organization_id: 'b1dc13fd-15fc-4183-be2f-191f7ec3685e',
      slug: 'limpieza-pro',
      vertical_type: 'service_lead_gen',
      primary_color: '#1E88E5',
      is_published: true
    }
  ], { onConflict: 'organization_id' });
  
  console.log('Tenant Sites upsert:', JSON.stringify(sites, null, 2));
  if (siteError) console.log('Site Error:', siteError);
}

check();
