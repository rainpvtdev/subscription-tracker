-- Add reset_tokens table
CREATE TABLE "reset_tokens" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster token lookups
CREATE INDEX idx_reset_tokens_token ON "reset_tokens" ("token");
CREATE INDEX idx_reset_tokens_user_id ON "reset_tokens" ("user_id");
