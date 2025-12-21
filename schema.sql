DROP TABLE IF EXISTS prompts;
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT, -- JSON array of strings
    created_at TEXT NOT NULL
);
