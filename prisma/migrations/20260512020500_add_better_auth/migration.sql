ALTER TABLE "User" ADD COLUMN "authUserId" TEXT;

CREATE TABLE "auth_user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session"("token");
CREATE INDEX "auth_session_userId_idx" ON "auth_session"("userId");
CREATE INDEX "auth_account_userId_idx" ON "auth_account"("userId");
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification"("identifier");

ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_verification" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "auth_user" FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE "auth_session" FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE "auth_account" FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE "auth_verification" FROM anon, authenticated, service_role;
