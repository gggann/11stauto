-- ================================================
-- ordermod 테이블 한국어 컬럼명 → 영문 변경
-- ================================================

-- 1. 컬럼 이름 변경
ALTER TABLE ordermod RENAME COLUMN "날짜" TO work_date;
ALTER TABLE ordermod RENAME COLUMN "이름" TO worker_name;
ALTER TABLE ordermod RENAME COLUMN "검카" TO search_category;
ALTER TABLE ordermod RENAME COLUMN "수정카테고리" TO corrected_category;
ALTER TABLE ordermod RENAME COLUMN "검수" TO review_status;

-- ================================================
-- 2. 모든 SQL 함수 재생성
-- ================================================

-- 2-1. submit_tasks
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
    SET corrected_category = v_sub->>'category',
        work_date = CURRENT_DATE
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

-- 2-2. get_daily_stats
DROP FUNCTION IF EXISTS get_daily_stats();

CREATE OR REPLACE FUNCTION get_daily_stats()
RETURNS TABLE(work_date TEXT, worker_name VARCHAR(255), work_count BIGINT)
LANGUAGE plpgsql
AS $fn$
BEGIN
    RETURN QUERY
    SELECT
        o.work_date::TEXT,
        o.assigned_to,
        COUNT(*)::BIGINT
    FROM ordermod o
    WHERE o.work_date IS NOT NULL
      AND o.assigned_to IS NOT NULL
      AND o.assigned_to != ''
      AND o.submitted_at IS NOT NULL
    GROUP BY o.work_date, o.assigned_to
    ORDER BY o.work_date DESC, o.assigned_to;
END;
$fn$;

-- 2-3. assign_tasks
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

-- 2-4. get_today_submitted_count
DROP FUNCTION IF EXISTS get_today_submitted_count(text);

CREATE OR REPLACE FUNCTION get_today_submitted_count(p_user_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $fn$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ordermod
    WHERE assigned_to = p_user_name
      AND submitted_at IS NOT NULL
      AND submitted_at::date = CURRENT_DATE;
    RETURN v_count;
END;
$fn$;

-- 2-5. get_free_count
DROP FUNCTION IF EXISTS get_free_count();

CREATE OR REPLACE FUNCTION get_free_count()
RETURNS BIGINT
LANGUAGE plpgsql
AS $fn$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ordermod
    WHERE (assigned_to IS NULL OR assigned_to = '')
      AND submitted_at IS NULL;
    RETURN v_count;
END;
$fn$;

-- 2-6. get_statistics
DROP FUNCTION IF EXISTS get_statistics();

CREATE OR REPLACE FUNCTION get_statistics()
RETURNS TABLE(total_products BIGINT, free_products BIGINT, submitted_products BIGINT, assigned_products BIGINT)
LANGUAGE plpgsql
AS $fn$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM ordermod)::BIGINT as total_products,
        (SELECT COUNT(*) FROM ordermod WHERE (assigned_to IS NULL OR assigned_to = '') AND submitted_at IS NULL)::BIGINT as free_products,
        (SELECT COUNT(*) FROM ordermod WHERE submitted_at IS NOT NULL)::BIGINT as submitted_products,
        (SELECT COUNT(*) FROM ordermod WHERE assigned_to IS NOT NULL AND submitted_at IS NULL)::BIGINT as assigned_products;
END;
$fn$;
