CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 32),
 name_key text NOT NULL UNIQUE,
 password_hash text NOT NULL,
 bio text NOT NULL DEFAULT '',
 avatar text,
 color text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_date ON posts(created_at DESC, id);
CREATE TABLE IF NOT EXISTS comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_post ON comments(post_id, created_at);
CREATE TABLE IF NOT EXISTS likes (
 post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text,
 is_group boolean NOT NULL DEFAULT false,
 direct_key text UNIQUE,
 created_by uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS members (
 conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS members_user ON members(user_id);
CREATE TABLE IF NOT EXISTS messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id),
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_chat ON messages(conversation_id, created_at DESC, id);
CREATE TABLE IF NOT EXISTS rate_limits (
 key text PRIMARY KEY,
 count integer NOT NULL,
 resets_at timestamptz NOT NULL
);

-- Owner-requested cleanup of the exact accounts created by our smoke tests.
-- UUID allowlist intentionally avoids matching real users by display name.
CREATE TEMP TABLE telejka_cleanup_ids ON COMMIT DROP AS
SELECT id FROM users WHERE id IN (
 '805b3a4d-7fb3-47d9-8faf-bf5585512262',
 'e39c95d6-d39c-464b-9b54-1cd6b497db2a',
 'c983da50-493c-477b-808a-1e393129dfe9',
 '8c17214c-3f71-4b08-8eb4-d6890aa53d30'
);
DELETE FROM conversations c
WHERE c.created_by IN (SELECT id FROM telejka_cleanup_ids)
AND NOT EXISTS (
 SELECT 1 FROM members m WHERE m.conversation_id = c.id
 AND m.user_id NOT IN (SELECT id FROM telejka_cleanup_ids)
);
-- Preserve any conversation that has acquired a real participant.
UPDATE conversations c SET created_by = (
 SELECT m.user_id FROM members m WHERE m.conversation_id = c.id
 AND m.user_id NOT IN (SELECT id FROM telejka_cleanup_ids)
 ORDER BY m.user_id LIMIT 1
) WHERE c.created_by IN (SELECT id FROM telejka_cleanup_ids);
DELETE FROM messages WHERE user_id IN (SELECT id FROM telejka_cleanup_ids);
DELETE FROM users WHERE id IN (SELECT id FROM telejka_cleanup_ids);
