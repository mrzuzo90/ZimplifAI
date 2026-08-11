const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzkqtlympxxonafzjspd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6a3F0bHltcHh4b25hZnpqc3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5OTkzNSwiZXhwIjoyMTAxOTc1OTM1fQ.3cWSk0FoeOYPoUobakansFoDArNPitEeeqRYHTa4fMA';

const sb = createClient(supabaseUrl, serviceKey);

async function check() {
  // Create tenant_sites for the organizations
  const { data: sites, error: siteError } = await sb.from('tenant_sites').upsert([
    {
      organization_id: '034b6723-c887-43fe-a882-ab6cb1ae0e0a',
      slug: 'brasa-carbon',
      name: 'Brasa Carbón',
      vertical_type: 'restaurant_booking',
      logo_url: 'https://zimplifai-crm.vercel.app/logo-restaurant.svg',
      primary_color: '#D93F3F',
      is_published: true,
      settings: {}
    },
    {
      organization_id: 'b1dc13fd-15fc-4183-be2f-191f7ec3685e',
      slug: 'limpieza-pro',
      name: 'Limpieza Pro',
      vertical_type: 'service_lead_gen',
      logo_url: 'https://zimplifai-crm.vercel.app/logo-services.svg',
      primary_color: '#1E88E5',
      is_published: true,
      settings: {}
    }
  ], { onConflict: 'organization_id' });
  
  console.log('Tenant Sites upsert:', JSON.stringify(sites, null, 2));
  if (siteError) console.log('Site Error:', siteError);
}

check();
