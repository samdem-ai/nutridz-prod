-- Avatar URL stored as TEXT (supports data URIs for embedded images)
ALTER TABLE users ADD COLUMN avatar_url TEXT NULL;
