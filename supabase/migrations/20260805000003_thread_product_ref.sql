-- Factory-thread messages can carry a structured PRODUCT reference, so a chat
-- started from a product shows the factory a product card (image/name/ref/price),
-- not just a text line. Denormalised jsonb — self-contained for rendering:
--   { id, factory_id, name_ar, name_en, image, ref_code, price, currency }
--
-- The trader writes it directly (base table); the masked factory-side RPC must
-- return it too, so recreate get_factory_thread_messages with the new column.

alter table public.factory_thread_messages
  add column if not exists product_ref jsonb;

-- CREATE OR REPLACE can't change a function's return type → drop + recreate.
drop function if exists public.get_factory_thread_messages(uuid);

create function public.get_factory_thread_messages(p_thread_id uuid)
 returns table(id uuid, sender_role text, content text, product_ref jsonb, created_at timestamptz)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not exists (select 1 from public.factory_threads t
                 where t.id = p_thread_id and public.factory_linked_to_me(t.factory_id)) then
    raise exception 'Not authorized.';
  end if;
  update public.factory_thread_messages set read_by_factory = true
   where thread_id = p_thread_id and sender_role = 'trader' and not read_by_factory;
  return query
    select m.id, m.sender_role, m.content, m.product_ref, m.created_at
    from public.factory_thread_messages m
    where m.thread_id = p_thread_id
    order by m.created_at;   -- sender_id deliberately NOT returned
end; $function$;
