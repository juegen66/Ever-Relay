CREATE TABLE IF NOT EXISTS "agent_registry" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "offline_capable" boolean DEFAULT false NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_registry_agent_id_unique_idx"
  ON "agent_registry" ("agent_id");

CREATE INDEX IF NOT EXISTS "agent_registry_offline_capable_idx"
  ON "agent_registry" ("offline_capable", "updated_at");

CREATE TABLE IF NOT EXISTS "agent_activity" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "agent_id" text NOT NULL REFERENCES "agent_registry"("agent_id"),
  "activity_type" text NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "thread_id" text,
  "run_id" text,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "agent_activity_user_created_idx"
  ON "agent_activity" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "agent_activity_user_agent_created_idx"
  ON "agent_activity" ("user_id", "agent_id", "created_at");

INSERT INTO "agent_registry" ("agent_id", "name", "description", "offline_capable", "metadata")
VALUES
  ('offline_discovery_agent', 'Offline Discovery Agent', 'Chooses the highest-value offline task and routes it to the correct app agent.', false, '{"runtimeAgentKey":"offline_discovery_agent","role":"discovery","appId":"system","scope":"Desktop","parallelWorkflowEnabled":false}'::jsonb),
  ('textedit_proactive_agent', 'TextEdit Proactive Agent', 'Creates candidate TextEdit drafts based on the user''s current work and preferences.', true, '{"runtimeAgentKey":"textedit_proactive_agent","appId":"textedit","scope":"Desktop","deliveryCapabilities":["desktop_item_candidate"],"offlineWorkflowEnabled":true,"parallelWorkflowEnabled":false}'::jsonb),
  ('main_agent', 'Desktop Copilot', 'Primary desktop assistant used by the main rollout.', true, '{"runtimeAgentKey":"main_agent","appId":"desktop","scope":"Desktop","offlineWorkflowEnabled":false,"parallelWorkflowEnabled":true}'::jsonb),
  ('canvas_agent', 'Canvas Copilot', 'Canvas specialist available for future offline workflows.', true, '{"runtimeAgentKey":"canvas_agent","appId":"canvas","scope":"Canvas","offlineWorkflowEnabled":false,"parallelWorkflowEnabled":true}'::jsonb),
  ('logo_agent', 'Logo Copilot', 'Logo specialist available for future offline workflows.', true, '{"runtimeAgentKey":"logo_agent","appId":"logo","scope":"Logo","offlineWorkflowEnabled":false,"parallelWorkflowEnabled":true}'::jsonb),
  ('coding_agent', 'Coding Copilot', 'Coding specialist available for future offline workflows.', true, '{"runtimeAgentKey":"coding_agent","appId":"vibecoding","scope":"VibeCoding","offlineWorkflowEnabled":false,"parallelWorkflowEnabled":true}'::jsonb),
  ('third_party_agent', 'Third-Party Copilot', 'Third-party specialist available for future offline workflows.', true, '{"runtimeAgentKey":"third_party_agent","appId":"third-party","scope":"Desktop","offlineWorkflowEnabled":false,"parallelWorkflowEnabled":true}'::jsonb),
  ('skill_test_agent', 'Skill Test Agent', 'Diagnostic agent used to verify DB-backed skills and internal workflow routing.', false, '{"runtimeAgentKey":"skill_test_agent","appId":"system","scope":"Desktop","parallelWorkflowEnabled":true}'::jsonb)
ON CONFLICT ("agent_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "offline_capable" = EXCLUDED."offline_capable",
  "metadata" = EXCLUDED."metadata",
  "updated_at" = now();
