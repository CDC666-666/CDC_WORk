CREATE TABLE "PortfolioVisitor" (
    "id" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioVisitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioPageView" (
    "eventId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioPageView_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "PortfolioPageView_occurredAt_idx" ON "PortfolioPageView"("occurredAt");
CREATE INDEX "PortfolioPageView_visitorId_occurredAt_idx" ON "PortfolioPageView"("visitorId", "occurredAt");
CREATE INDEX "PortfolioPageView_path_occurredAt_idx" ON "PortfolioPageView"("path", "occurredAt");
ALTER TABLE "PortfolioPageView" ADD CONSTRAINT "PortfolioPageView_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "PortfolioVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
