-- Bloat bloat-test: delete ONLY the 19 verified synthetic test accounts from 19 Nov 2026.
-- PART A (read only). Run this first. It must list exactly 19 rows, every one with ok = true.
with expected(id, email) as (values
    ('diary-1119c@bloat.test'::uuid, '10fe398b-ce89-464d-b367-b3f6213fc516'),
    ('export-1119@bloat.test'::uuid, '19fae94f-9935-47a5-a93a-253372878453'),
    ('isoa-1119@bloat.test'::uuid, '1c9648b0-058c-4c69-8207-a8b4eb3c4e30'),
    ('isoa-1119c@bloat.test'::uuid, '239f7c93-888c-4e34-b39e-cafc57ae9306'),
    ('p1-1119@bloat.test'::uuid, '2a8e702b-c7e4-4b8f-8362-9b1c28667245'),
    ('p1-1119c@bloat.test'::uuid, '31a9b081-d7f5-4c85-bb05-ff8775ee9d4d'),
    ('isob-1119b@bloat.test'::uuid, '54a37262-9572-4bb8-8f5d-64e0314e9d47'),
    ('isob-1119@bloat.test'::uuid, '5750356f-90aa-43c7-902c-87e2e1004346'),
    ('public-1119@bloat.test'::uuid, '63675f99-fbb7-43dc-a5a7-181ed33dd270'),
    ('isob-1119c@bloat.test'::uuid, '79fbf203-f516-4371-9dee-104602547490'),
    ('isoa-1119b@bloat.test'::uuid, '79fde507-fbea-4d1d-a266-ebb77e5bfe16'),
    ('diary-1119b@bloat.test'::uuid, '7fe1a02c-b678-4f16-9375-e714fcbe9f80'),
    ('p1-1119b@bloat.test'::uuid, '870b0122-6648-443f-b04d-807004bbfcd8'),
    ('export-1119c@bloat.test'::uuid, '98f4707b-0d3c-42c6-a397-b750494059b8'),
    ('public-1119c@bloat.test'::uuid, 'b22bcf2f-1da6-41dd-a1fc-70c24f3f635d'),
    ('pro-tester@bloat.test'::uuid, 'c30859f9-2ec4-456d-819c-94cc31e875a3'),
    ('diary-1119@bloat.test'::uuid, 'd67e10f1-1a62-47b3-a8f8-96a5707191e6'),
    ('public-1119b@bloat.test'::uuid, 'db3aae4f-47be-486a-8701-28f0824e11ed'),
    ('export-1119b@bloat.test'::uuid, 'dbe7c77a-1f8a-4eb9-873f-cba6660027a6')
)
select e.email, e.id, u.email is not null as exists,
       coalesce(u.email = e.email and u.raw_user_meta_data->>'synthetic_test_run' = '2026-11-19', false) as ok
from expected e left join auth.users u on u.id = e.id
union all
select u.email || '  (NOT ON THE LIST)', u.id, true, false
from auth.users u
where u.raw_user_meta_data->>'synthetic_test_run' = '2026-11-19'
  and u.id not in (select id from expected)
order by 1;

-- PART B (deletes). Run only if Part A showed 19 rows, all ok = true. It checks everything again and
-- stops with "ABORTED ... Nothing deleted." if anything differs. All or nothing.
do $guard$
declare n_match int; n_marked int; n_deleted int;
begin
  create temporary table expected_accounts (id uuid primary key, email text not null) on commit drop;
  insert into expected_accounts values
    ('diary-1119c@bloat.test'::uuid, '10fe398b-ce89-464d-b367-b3f6213fc516'),
    ('export-1119@bloat.test'::uuid, '19fae94f-9935-47a5-a93a-253372878453'),
    ('isoa-1119@bloat.test'::uuid, '1c9648b0-058c-4c69-8207-a8b4eb3c4e30'),
    ('isoa-1119c@bloat.test'::uuid, '239f7c93-888c-4e34-b39e-cafc57ae9306'),
    ('p1-1119@bloat.test'::uuid, '2a8e702b-c7e4-4b8f-8362-9b1c28667245'),
    ('p1-1119c@bloat.test'::uuid, '31a9b081-d7f5-4c85-bb05-ff8775ee9d4d'),
    ('isob-1119b@bloat.test'::uuid, '54a37262-9572-4bb8-8f5d-64e0314e9d47'),
    ('isob-1119@bloat.test'::uuid, '5750356f-90aa-43c7-902c-87e2e1004346'),
    ('public-1119@bloat.test'::uuid, '63675f99-fbb7-43dc-a5a7-181ed33dd270'),
    ('isob-1119c@bloat.test'::uuid, '79fbf203-f516-4371-9dee-104602547490'),
    ('isoa-1119b@bloat.test'::uuid, '79fde507-fbea-4d1d-a266-ebb77e5bfe16'),
    ('diary-1119b@bloat.test'::uuid, '7fe1a02c-b678-4f16-9375-e714fcbe9f80'),
    ('p1-1119b@bloat.test'::uuid, '870b0122-6648-443f-b04d-807004bbfcd8'),
    ('export-1119c@bloat.test'::uuid, '98f4707b-0d3c-42c6-a397-b750494059b8'),
    ('public-1119c@bloat.test'::uuid, 'b22bcf2f-1da6-41dd-a1fc-70c24f3f635d'),
    ('pro-tester@bloat.test'::uuid, 'c30859f9-2ec4-456d-819c-94cc31e875a3'),
    ('diary-1119@bloat.test'::uuid, 'd67e10f1-1a62-47b3-a8f8-96a5707191e6'),
    ('public-1119b@bloat.test'::uuid, 'db3aae4f-47be-486a-8701-28f0824e11ed'),
    ('export-1119b@bloat.test'::uuid, 'dbe7c77a-1f8a-4eb9-873f-cba6660027a6');
  select count(*) into n_match from auth.users u join expected_accounts e on e.id = u.id
   where u.email = e.email and u.raw_user_meta_data->>'synthetic_test_run' = '2026-11-19';
  if n_match <> 19 then
    raise exception 'ABORTED: % of the 19 listed accounts match (ID, email and marker). Nothing deleted.', n_match;
  end if;
  select count(*) into n_marked from auth.users where raw_user_meta_data->>'synthetic_test_run' = '2026-11-19';
  if n_marked <> 19 then
    raise exception 'ABORTED: % accounts carry the marker 2026-11-19, expected exactly 19. Nothing deleted.', n_marked;
  end if;
  delete from auth.users u using expected_accounts e
   where u.id = e.id and u.email = e.email and u.raw_user_meta_data->>'synthetic_test_run' = '2026-11-19';
  get diagnostics n_deleted = row_count;
  if n_deleted <> 19 then
    raise exception 'ABORTED: the delete matched % accounts, expected 19. Nothing deleted.', n_deleted;
  end if;
  raise notice 'Deleted exactly 19 synthetic test accounts (marker 2026-11-19).';
end
$guard$;

-- PART C (read only). Must show 0.
select count(*) as accounts_left_with_marker from auth.users
where raw_user_meta_data->>'synthetic_test_run' = '2026-11-19';

