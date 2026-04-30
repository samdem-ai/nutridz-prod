-- TEXT was too small for base64-encoded avatars. Bump to MEDIUMTEXT (16MB capacity).
ALTER TABLE users MODIFY COLUMN avatar_url MEDIUMTEXT NULL;
