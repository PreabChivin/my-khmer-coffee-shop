-- Multi-tier discount badges: flat ($ off) discount + a cosmetic promo tag.
-- Both additive with safe defaults (0 / NULL), so existing products and
-- their prices are untouched — zero risk to existing data.
ALTER TABLE "Product" ADD COLUMN "flatDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "promoTag" TEXT;
