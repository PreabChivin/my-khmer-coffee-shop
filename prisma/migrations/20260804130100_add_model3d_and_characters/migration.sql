-- AlterTable
ALTER TABLE "ShopItem" ADD COLUMN     "model3d" JSONB;

-- Give the 16 existing seeded items a placeholder-geometry descriptor for
-- the 3D avatar engine (see ShopItem.model3d doc comment in schema.prisma).
UPDATE "ShopItem" SET "model3d" = '{"shape":"cone","color":"#3A1E05"}' WHERE "slug" = 'coffee-bean-cap';
UPDATE "ShopItem" SET "model3d" = '{"shape":"box","color":"#1a1a2e"}' WHERE "slug" = 'graduate-cap';
UPDATE "ShopItem" SET "model3d" = '{"shape":"cylinder","color":"#111111","scale":[1,1.4,1]}' WHERE "slug" = 'dapper-top-hat';
UPDATE "ShopItem" SET "model3d" = '{"shape":"torus","color":"#FFD45A"}' WHERE "slug" = 'golden-crown';
UPDATE "ShopItem" SET "model3d" = '{"shape":"torus","color":"#333333"}' WHERE "slug" = 'nerd-glasses';
UPDATE "ShopItem" SET "model3d" = '{"shape":"torus","color":"#1a1a1a"}' WHERE "slug" = 'cool-sunglasses';
UPDATE "ShopItem" SET "model3d" = '{"shape":"torus","color":"#8a5636"}' WHERE "slug" = 'barista-goggles';
UPDATE "ShopItem" SET "model3d" = '{"shape":"torus","color":"#f4638a"}' WHERE "slug" = 'sparkle-vision';
UPDATE "ShopItem" SET "model3d" = '{"shape":"box","color":"#4a2c11"}' WHERE "slug" = 'barista-apron';
UPDATE "ShopItem" SET "model3d" = '{"shape":"box","color":"#A43F1D"}' WHERE "slug" = 'cozy-hoodie';
UPDATE "ShopItem" SET "model3d" = '{"shape":"box","color":"#ff85a1"}' WHERE "slug" = 'party-dress';
UPDATE "ShopItem" SET "model3d" = '{"shape":"box","color":"#2a180b"}' WHERE "slug" = 'ninja-gi';
UPDATE "ShopItem" SET "model3d" = '{"shape":"cylinder","color":"#fff7ef","accentColor":"#3A1E05"}' WHERE "slug" = 'classic-coffee-cup';
UPDATE "ShopItem" SET "model3d" = '{"shape":"cylinder","color":"#f6c9ba","accentColor":"#8B0000"}' WHERE "slug" = 'boba-cup';
UPDATE "ShopItem" SET "model3d" = '{"shape":"cylinder","color":"#9a82ea","scale":[0.6,1.6,0.6]}' WHERE "slug" = 'baristas-wand';
UPDATE "ShopItem" SET "model3d" = '{"shape":"cylinder","color":"#ffc32e","accentColor":"#eca617"}' WHERE "slug" = 'golden-mug';

-- New Character Base Store catalog (2 free starters + Rare/Epic/Legendary).
INSERT INTO "ShopItem" ("id", "slug", "name", "nameKh", "category", "tier", "cost", "emoji", "description", "model3d", "isAvailable", "createdAt", "updatedAt") VALUES
  ('17925a5d-1312-4571-83c7-fe5b823c0c18', 'default-barista-boy', 'Default Barista', 'បារីស្តាលំនាំដើម (ប្រុស)', 'BASE_CHARACTER', 'COMMON', 0, '🧑‍🍳', NULL, '{"shape":"capsule-figure","color":"#bd8360","accentColor":"#4a2c11"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e59ade31-57d3-4879-ab3f-12daa78df10e', 'default-barista-girl', 'Default Barista (Girl)', 'បារីស្តាលំនាំដើម (ស្រី)', 'BASE_CHARACTER', 'COMMON', 0, '👩‍🍳', NULL, '{"shape":"capsule-figure","color":"#e2ab8d","accentColor":"#8B0000"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('4846b14b-d58d-45c4-8cab-00f19281c237', 'dino-cafe-mascot', 'Dino Cafe Mascot', 'ដាយណូស័រម៉ាស្កូតកាហ្វេ', 'BASE_CHARACTER', 'RARE', 150, '🦖', NULL, '{"shape":"dino-blocky","color":"#4c7a3f","accentColor":"#2f4d27"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('eb6499c2-bad6-4967-a234-9ef2bee84aff', 'cyberpunk-barista', 'Cyberpunk Barista', 'បារីស្តាអនាគត', 'BASE_CHARACTER', 'EPIC', 320, '🤖', NULL, '{"shape":"cyber-angular","color":"#1a1a2e","accentColor":"#00e5ff"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f1d5a7a1-0031-43e0-90c2-945648b3f27c', 'golden-espresso-panda', 'Golden Espresso Panda', 'ផេនដាមាសកាហ្វេ', 'BASE_CHARACTER', 'LEGENDARY', 600, '🐼', NULL, '{"shape":"panda-round","color":"#fffdf9","accentColor":"#ffc32e"}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
