-- CreateTable
CREATE TABLE "UpdateRelease" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT NOT NULL,
    "fileSha512" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "portableUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateRelease_pkey" PRIMARY KEY ("id")
);
