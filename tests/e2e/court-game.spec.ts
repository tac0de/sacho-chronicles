import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('조선 사관 시뮬레이션: 사초: 춘추필법 E2E 테스트 및 UI 검증', () => {
  test.beforeAll(async () => {
    const screenshotDir = path.resolve('screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('1. 초기 화면 및 양옆 패널 레이아웃/스크롤 무결성 검증', async ({ page }) => {
    await page.goto('/?seed=12345');

    // 타이틀 및 헤더 배지 확인
    await expect(page.locator('.title-group h1')).toContainText('사초 (史草)');
    await expect(page.locator('.day-badge')).toContainText('Day 1');

    // 좌측 5개 전각 카드 확인 및 기류(Omen) 징후 배지 확인
    const locationCards = page.locator('.location-card');
    await expect(locationCards).toHaveCount(5);
    await expect(page.locator('.location-omen').first()).toBeVisible();
    await expect(page.locator('.omen-badge').first()).toContainText('氣流');

    // 좌측 하단 사관 직무 규정 수결 확인
    await expect(page.locator('.scribe-dossier')).toBeVisible();
    await expect(page.locator('.scribe-dossier')).toContainText('춘추관 사관');

    // 우측 12명 관원 카드 확인
    const officialCards = page.locator('.official-card');
    await expect(officialCards).toHaveCount(12);

    // 최하단 12번째 관원(승정원 서리 최달식) 가시성 및 스크롤 검증
    const lastOfficial = page.locator('.official-card[data-agent-id="court_clerk"]');
    await lastOfficial.scrollIntoViewIfNeeded();
    await expect(lastOfficial).toBeVisible();
    await expect(lastOfficial).toContainText('최달식');

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/01-initial-court.png', fullPage: true });
  });

  test('2. 사관의 하루 일과: 처소 선택, 정무 관찰, 사초 집필 루프 검증', async ({ page }) => {
    await page.goto('/?seed=12345');

    // 1) 궐내 천랑(회랑) 처소 선택
    const corridorCard = page.locator('.location-card[data-id="PALACE_CORRIDOR"]');
    await corridorCard.click();
    await expect(corridorCard).toHaveClass(/selected/);

    // 2) [당일 정무 입조 관찰] 버튼 클릭
    const advanceBtn = page.locator('#btn-advance');
    await advanceBtn.click();

    // 3) 관찰된 정보 카드가 노출되는지 확인
    const infoCards = page.locator('.info-card');
    const infoCount = await infoCards.count();
    expect(infoCount).toBeGreaterThanOrEqual(1);

    // 4) 사초 필법 라디오 옵션 선택 (단정 극필 선택)
    const assertiveRadio = page.locator('.sacho-option input[value="ASSERTIVE"]').first();
    if (await assertiveRadio.isVisible()) {
      await assertiveRadio.check();
    }

    // 5) [오늘의 사초 봉인 및 익일 진행] 클릭 -> 바로 Day 2 전환 검증
    const saveSachoBtn = page.locator('#btn-save-sacho');
    await saveSachoBtn.click();

    // 바로 Day 2로 진행되었는지 확인
    await expect(page.locator('.day-badge')).toContainText('Day 2');

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/02-daily-observation.png', fullPage: true });
  });

  test('3. 사초 기록부(史草錄) 탭 및 史臣曰 평어 열람 검증', async ({ page }) => {
    await page.goto('/?seed=12345');

    // 1일차 관찰 및 사초 봉인 진행
    await page.locator('#btn-advance').click(); // 관찰 시작
    if (await page.locator('#btn-save-sacho').isVisible()) {
      await page.locator('#btn-save-sacho').click(); // 사초 봉인
    }

    // 사초 기록부 탭 전환
    await page.locator('#tab-sacho').click();
    await expect(page.locator('#tab-sacho')).toHaveClass(/active/);

    const sachoItems = page.locator('.sacho-archive-item');
    await expect(sachoItems.first()).toBeVisible();

    // 史臣曰 평어 표시 확인
    await expect(page.locator('.sacho-commentary').first()).toContainText('史臣曰');

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/03-sacho-book.png', fullPage: true });
  });

  test('4. 사헌부 감찰록(디버그 패널) 및 12x12 관계 매트릭스 검증', async ({ page }) => {
    await page.goto('/?seed=12345');

    // 1일차 정무 관찰을 시작하여 WorldFact 발생시킴
    await page.locator('#btn-advance').click();

    // 디버그 모드 토글
    const debugBtn = page.locator('#btn-debug-toggle');
    await debugBtn.click();
    await expect(page.locator('.debug-panel')).not.toHaveClass(/hidden/);

    // World Facts 테이블 확인
    await expect(page.locator('.debug-table')).toBeVisible();

    // 관계 매트릭스 탭 클릭
    await page.locator('.debug-tab[data-tab="RELATIONS"]').click();
    await expect(page.locator('.debug-table')).toBeVisible();

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/04-debug-panel.png', fullPage: true });

    // 디버그 패널 닫기
    await page.locator('#btn-debug-close').click();
    await expect(page.locator('.debug-panel')).toHaveClass(/hidden/);
  });

  test('5. 실록 편찬 엔딩(역사의 심판) 족자 모달 및 통계 검증', async ({ page }) => {
    await page.goto('/?seed=12345');

    // 실록 편찬 버튼 클릭
    const compileSilokBtn = page.locator('#btn-compile-silok');
    await expect(compileSilokBtn).toBeVisible();
    await compileSilokBtn.click();

    // 엔딩 족자 모달 확인
    const scrollModal = page.locator('.ending-scroll-container');
    await expect(scrollModal).toBeVisible();

    // 칭호 및 통계 확인
    await expect(page.locator('.title-badge-large')).toBeVisible();
    await expect(page.locator('.ending-stats-grid')).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(4);

    // 족자 이미지 저장 버튼 확인
    await expect(page.locator('#btn-download-scroll')).toBeVisible();

    // 12인 판결문 확인
    const verdicts = page.locator('.verdict-item');
    await expect(verdicts).toHaveCount(12);

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/05-silok-ending.png', fullPage: true });

    // 닫기 버튼 클릭 확인
    await page.locator('#btn-ending-close-x').click();
    await expect(scrollModal).not.toBeVisible();
  });
});
