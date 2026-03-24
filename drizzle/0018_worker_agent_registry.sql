INSERT INTO "agent_registry" ("agent_id", "name", "description", "offline_capable", "metadata")
VALUES (
  'workerAgent',
  'Worker Agent',
  'Internal workflow worker used as the default task executor when a task does not specify an agent id.',
  false,
  '{"runtimeAgentKey":"workerAgent","role":"worker","appId":"system","scope":"Desktop","parallelWorkflowEnabled":true}'::jsonb
)
ON CONFLICT ("agent_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "offline_capable" = EXCLUDED."offline_capable",
  "metadata" = EXCLUDED."metadata",
  "updated_at" = now();
