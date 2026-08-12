/*
# Make wilaya_code and commune_id nullable on profiles

Allows touchProfile to upsert a profile row with only id + phone + name
for sign-in flows, without triggering NOT NULL violations.
*/
ALTER TABLE profiles ALTER COLUMN wilaya_code DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN commune_id DROP NOT NULL;