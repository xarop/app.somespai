DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spaces' AND column_name='phone') THEN
    ALTER TABLE spaces ADD COLUMN phone TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spaces' AND column_name='email_contact') THEN
    ALTER TABLE spaces ADD COLUMN email_contact TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spaces' AND column_name='whatsapp') THEN
    ALTER TABLE spaces ADD COLUMN whatsapp TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spaces' AND column_name='web') THEN
    ALTER TABLE spaces ADD COLUMN web TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spaces' AND column_name='contact_default') THEN
    ALTER TABLE spaces ADD COLUMN contact_default TEXT DEFAULT 'email';
  END IF;
END $$;

UPDATE spaces
SET
  email_contact = CASE
    WHEN contact_url LIKE 'mailto:%' THEN substring(contact_url FROM 8)
    ELSE email_contact
  END,
  whatsapp = CASE
    WHEN contact_url LIKE '%wa.me/%' THEN
      CASE
        WHEN substring(contact_url FROM position('wa.me/' IN contact_url) + 6) LIKE '34%'
        THEN '+' || substring(contact_url FROM position('wa.me/' IN contact_url) + 6)
        ELSE '+' || substring(contact_url FROM position('wa.me/' IN contact_url) + 6)
      END
    ELSE whatsapp
  END,
  web = CASE
    WHEN contact_url LIKE 'https://%' AND contact_url NOT LIKE '%wa.me/%' THEN contact_url
    ELSE web
  END
WHERE contact_url IS NOT NULL;

UPDATE spaces
SET contact_default =
  CASE
    WHEN whatsapp IS NOT NULL THEN 'whatsapp'
    WHEN email_contact IS NOT NULL THEN 'email'
    WHEN web IS NOT NULL THEN 'web'
    ELSE 'web'
  END
WHERE contact_url IS NOT NULL;
