-- 1) submit_tasks 함수 수정: 날짜를 DATE 타입으로 저장
DROP FUNCTION IF EXISTS submit_tasks(text, jsonb);

CREATE OR REPLACE FUNCTION submit_tasks(p_user_name TEXT, p_submissions JSONB)
RETURNS BIGINT
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_count BIGINT;
  v_sub JSONB;
BEGIN
  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_submissions)
  LOOP
    UPDATE ordermod
    SET "수정카테고리" = v_sub->>'category',
        "날짜" = CURRENT_DATE
    WHERE prd_no = (v_sub->>'prd_no')::BIGINT
      AND assigned_to = p_user_name;
  END LOOP;

  UPDATE ordermod
  SET submitted_at = NOW()
  WHERE assigned_to = p_user_name
    AND submitted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$fn$;

-- 2) 기존 제출된 데이터에 날짜 채우기 (submitted_at 기준)
UPDATE ordermod
SET "날짜" = submitted_at::DATE
WHERE submitted_at IS NOT NULL
  AND "날짜" IS NULL;
