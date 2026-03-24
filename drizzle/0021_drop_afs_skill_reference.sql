-- Drop AFS skill reference documents table (reverses 0016_afs_skill_reference.sql table creation)

DROP INDEX IF EXISTS "afs_skill_reference_user_skill_active_idx";
DROP INDEX IF EXISTS "afs_skill_reference_skill_name_idx";
DROP TABLE IF EXISTS "afs_skill_reference";
