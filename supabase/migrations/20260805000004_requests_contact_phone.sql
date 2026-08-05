-- Import/managed requests: collect the buyer's WhatsApp/mobile number on the
-- form so the Maabar team can follow up directly (door-to-door managed service).
alter table public.requests
  add column if not exists contact_phone text;
