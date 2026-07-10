-- Adds nullable date of birth to User (used to derive generation tier).
-- Purely additive with no default — existing accounts get NULL, zero risk.
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
