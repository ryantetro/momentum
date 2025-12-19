-- Add usage_count to contract_templates table
ALTER TABLE contract_templates
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_usage_count 
ON contract_templates(usage_count);

