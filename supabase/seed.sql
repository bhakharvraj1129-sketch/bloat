-- LOCAL DEVELOPMENT ONLY. This secret is public and works only on a developer's own machine.
insert into private.server_secrets (name, sha256_hex)
values ('local-dev', encode(sha256(convert_to('local-dev-server-secret-not-for-hosted-use', 'utf8')), 'hex'))
on conflict (name) do nothing;
