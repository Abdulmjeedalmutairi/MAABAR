-- Pin search_path on the 11 advisor-flagged functions (function_search_path_mutable).
-- ALTER FUNCTION ... SET changes ONLY the config, never the body → zero logic change.
-- '' for functions that already fully-qualify every object (max safety); 'public'
-- for the two that reference tables unqualified, to preserve their behavior.

-- SECURITY DEFINER (injection targets) — fully qualified → empty search_path
alter function public.is_admin()                            set search_path = '';
alter function public.handle_new_user()                     set search_path = '';

-- SECURITY INVOKER, fully qualified / builtins only → empty search_path
alter function public.is_service_role()                     set search_path = '';
alter function public.request_jwt_role()                    set search_path = '';
alter function public.gen_short_slug(integer)               set search_path = '';
alter function public.generate_maabar_supplier_id()         set search_path = '';
alter function public.ensure_supplier_maabar_id()           set search_path = '';
alter function public.touch_updated_at()                    set search_path = '';
alter function public.touch_product_variant_updated_at()    set search_path = '';

-- SECURITY INVOKER, reference tables UNQUALIFIED → 'public' (required, not to break)
alter function public.update_supplier_completion_rate(uuid) set search_path = public;
alter function public.update_supplier_total_sales(uuid)     set search_path = public;
