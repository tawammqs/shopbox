UPDATE the_shoes_theme_settings
SET settings = jsonb_set(settings, '{whatsapp_button}', to_jsonb(regexp_replace(settings->>'whatsapp_button', '\D', '', 'g')))
WHERE settings->>'whatsapp_button' ~ '\D';

UPDATE stores SET whatsapp = regexp_replace(whatsapp, '\D', '', 'g') WHERE whatsapp ~ '\D';