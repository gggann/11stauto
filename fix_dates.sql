-- assign_tasks 반환 타입 수정: prd_nm은 varchar(255)
DROP FUNCTION IF EXISTS assign_tasks(text, integer);

CREATE OR REPLACE FUNCTION assign_tasks(p_user_name TEXT, p_count INTEGER)
RETURNS TABLE(o_id INTEGER, o_prd_no BIGINT, o_prd_nm VARCHAR(255))
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- 1. 전역 타임아웃: 1시간 초과 미제출 작업 릴리즈
  UPDATE ordermod
  SET assigned_to = NULL, assigned_at = NULL
  WHERE assigned_to IS NOT NULL
    AND submitted_at IS NULL
    AND assigned_at < NOW() - INTERVAL '1 hour';

  -- 2. 즉시 릴리즈: 해당 작업자의 미제출 기존 작업
  UPDATE ordermod
  SET assigned_to = NULL, assigned_at = NULL
  WHERE assigned_to = p_user_name
    AND submitted_at IS NULL;

  -- 3. 새 작업 배분
  RETURN QUERY
  UPDATE ordermod
  SET assigned_to = p_user_name, assigned_at = NOW()
  WHERE "ID" IN (
    SELECT "ID" FROM ordermod
    WHERE assigned_to IS NULL
      AND submitted_at IS NULL
    ORDER BY "ID"
    LIMIT p_count
    FOR UPDATE SKIP LOCKED
  )
  RETURNING "ID", prd_no, prd_nm;
END;
$fn$;
