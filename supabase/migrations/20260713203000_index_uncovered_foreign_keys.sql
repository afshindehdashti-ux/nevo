-- Add indexes only where a foreign key has no covering index. This keeps
-- parent deletes/updates and common relationship lookups from scanning child tables.
DO $$
DECLARE
  fk record;
  index_name text;
  column_list text;
BEGIN
  FOR fk IN
    SELECT
      constraint_row.conrelid,
      constraint_row.conkey,
      table_schema.nspname AS schema_name,
      table_row.relname AS table_name
    FROM pg_constraint AS constraint_row
    JOIN pg_class AS table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace AS table_schema ON table_schema.oid = table_row.relnamespace
    WHERE constraint_row.contype = 'f'
      AND constraint_row.connamespace = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index AS existing_index
        WHERE existing_index.indrelid = constraint_row.conrelid
          AND existing_index.indisvalid
          AND ((existing_index.indkey::smallint[])[0:array_length(constraint_row.conkey, 1) - 1]) = constraint_row.conkey
      )
  LOOP
    SELECT string_agg(format('%I', attribute_row.attname), ', ' ORDER BY key_column.ordinality)
    INTO column_list
    FROM unnest(fk.conkey) WITH ORDINALITY AS key_column(attnum, ordinality)
    JOIN pg_attribute AS attribute_row
      ON attribute_row.attrelid = fk.conrelid
     AND attribute_row.attnum = key_column.attnum;

    index_name := format(
      'idx_fk_%s_%s',
      left(fk.table_name, 40),
      substr(md5(fk.conrelid::text || fk.conkey::text), 1, 10)
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
      index_name,
      fk.schema_name,
      fk.table_name,
      column_list
    );
  END LOOP;
END
$$;
