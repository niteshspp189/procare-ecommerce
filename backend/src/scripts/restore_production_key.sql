BEGIN;
INSERT INTO api_key (id, title, token, salt, redacted, type, created_by, created_at, updated_at)
VALUES (
    'apk_01KQEHXAEYJ6F91MYSP0PW7DG1',
    'Default Publishable API Key',
    'pk_f72c7560dd53b083d2d378e1dbf91bbbf11f172c8d8724c2b21626b45cbd83f0',
    '',
    'pk_f72***3f0',
    'publishable',
    '',
    '2026-04-30 06:41:07.553+00',
    '2026-04-30 06:41:07.553+00'
)
ON CONFLICT (id) DO NOTHING;

DELETE FROM publishable_api_key_sales_channel 
WHERE publishable_key_id = 'apk_01KQEHXAEYJ6F91MYSP0PW7DG1' 
  AND sales_channel_id = 'sc_01KPE3YFH2SZ2A0PG84F90E06H';

INSERT INTO publishable_api_key_sales_channel (publishable_key_id, sales_channel_id, id, created_at, updated_at)
VALUES (
    'apk_01KQEHXAEYJ6F91MYSP0PW7DG1',
    'sc_01KPE3YFH2SZ2A0PG84F90E06H',
    'pksc_production_restored_link',
    NOW(),
    NOW()
);
COMMIT;
