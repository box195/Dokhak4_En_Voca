// 에빙하우스 망각곡선 기반 간격 반복 시스템 (SRS) & 실시간 클라우드 자동 동기화
class SRSManager {
    constructor() {
        this.STORAGE_KEY = 'DOKHAK_VOCA_USER_DATA_V1';
        this.SYNC_ID_KEY = 'DOKHAK_CLOUD_SYNC_ID';
        this.syncId = localStorage.getItem(this.SYNC_ID_KEY) || '';
        this.syncDebounceTimer = null;
        this.isSyncing = false;
        
        this.data = this.loadData();
        
        // 클라우드 자동 동기화 켜져 있으면 최초 풀링
        if (this.syncId) {
            this.pullFromCloud();
        }
    }

    // 기본 사용자 상태 초기화
    getDefaultData() {
        return {
            hearts: 5,
            maxHearts: 5,
            lastHeartTime: Date.now(),
            xp: 0,
            streak: 1,
            lastStudyDate: new Date().toISOString().split('T')[0],
            completedDays: {}, // { "VOCA 01": { stars: 3, score: 100, completedAt: ... } }
            wordStats: {},     // { "word_id": { level: 0~5, nextReview: timestamp, wrongCount: 0, rightCount: 0, starred: false } }
            wrongNotes: [],    // [ word_id, ... ]
            updatedAt: Date.now()
        };
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return Object.assign(this.getDefaultData(), parsed);
            }
        } catch (e) {
            console.error("Failed to load user data:", e);
        }
        return this.getDefaultData();
    }

    saveData() {
        try {
            this.data.updatedAt = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            this.triggerAutoCloudSync();
        } catch (e) {
            console.error("Failed to save user data:", e);
        }
    }

    // 하트 자동 충전 체크 (30분마다 1개 충전)
    updateHearts() {
        if (this.data.hearts >= this.data.maxHearts) {
            this.data.lastHeartTime = Date.now();
            return;
        }
        const now = Date.now();
        const diffMs = now - this.data.lastHeartTime;
        const RECHARGE_INTERVAL = 30 * 60 * 1000; // 30분
        const addedHearts = Math.floor(diffMs / RECHARGE_INTERVAL);

        if (addedHearts > 0) {
            this.data.hearts = Math.min(this.data.maxHearts, this.data.hearts + addedHearts);
            this.data.lastHeartTime = now - (diffMs % RECHARGE_INTERVAL);
            this.saveData();
        }
    }

    useHeart() {
        this.updateHearts();
        if (this.data.hearts > 0) {
            this.data.hearts--;
            this.data.lastHeartTime = Date.now();
            this.saveData();
            return true;
        }
        return false;
    }

    refillHearts() {
        this.data.hearts = this.data.maxHearts;
        this.data.lastHeartTime = Date.now();
        this.saveData();
    }

    // 출석 스트릭 체크
    checkStreak() {
        const today = new Date().toISOString().split('T')[0];
        if (this.data.lastStudyDate === today) return;

        const last = new Date(this.data.lastStudyDate);
        const curr = new Date(today);
        const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            this.data.streak++;
        } else if (diffDays > 1) {
            this.data.streak = 1;
        }
        this.data.lastStudyDate = today;
        this.saveData();
    }

    addXP(amount) {
        this.data.xp += amount;
        this.checkStreak();
        this.saveData();
    }

    // SRS 복습 주기 간격 (일 단위)
    getIntervalDays(level) {
        const intervals = [1, 2, 4, 7, 14, 30]; // 0~5단계
        return intervals[Math.min(level, intervals.length - 1)];
    }

    // 단어 정답 처리
    recordRight(wordId) {
        if (!this.data.wordStats[wordId]) {
            this.data.wordStats[wordId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        const stat = this.data.wordStats[wordId];
        stat.rightCount++;
        stat.level = Math.min(stat.level + 1, 5);
        
        const days = this.getIntervalDays(stat.level);
        stat.nextReview = Date.now() + (days * 24 * 60 * 60 * 1000);

        const idx = this.data.wrongNotes.indexOf(wordId);
        if (idx !== -1) {
            this.data.wrongNotes.splice(idx, 1);
        }

        this.addXP(10);
        this.saveData();
    }

    // 단어 오답 처리
    recordWrong(wordId) {
        if (!this.data.wordStats[wordId]) {
            this.data.wordStats[wordId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        const stat = this.data.wordStats[wordId];
        stat.wrongCount++;
        stat.level = Math.max(0, stat.level - 1);
        stat.nextReview = Date.now() + (12 * 60 * 60 * 1000);

        if (!this.data.wrongNotes.includes(wordId)) {
            this.data.wrongNotes.push(wordId);
        }

        this.saveData();
    }

    // 북마크 토글
    toggleStar(wordId) {
        if (!this.data.wordStats[wordId]) {
            this.data.wordStats[wordId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        this.data.wordStats[wordId].starred = !this.data.wordStats[wordId].starred;
        this.saveData();
        return this.data.wordStats[wordId].starred;
    }

    // 스테이지 완료 기록
    recordStageComplete(category, score, total) {
        const ratio = score / total;
        let stars = 1;
        if (ratio >= 0.9) stars = 3;
        else if (ratio >= 0.7) stars = 2;

        const prev = this.data.completedDays[category];
        if (!prev || stars > prev.stars) {
            this.data.completedDays[category] = {
                stars: stars,
                score: score,
                total: total,
                completedAt: Date.now()
            };
        }
        this.addXP(50 * stars);
        this.saveData();
    }

    // 오늘 복습해야 할 단어 목록 가져오기
    getDueReviewWords(allWords) {
        const now = Date.now();
        const dueList = [];
        for (const w of allWords) {
            const stat = this.data.wordStats[w.id];
            if (stat && stat.nextReview > 0 && stat.nextReview <= now) {
                dueList.push(w);
            }
        }
        return dueList;
    }

    // ================= ☁️ 실시간 클라우드 자동 동기화 엔진 =================
    setSyncId(id) {
        this.syncId = id.trim().toLowerCase();
        localStorage.setItem(this.SYNC_ID_KEY, this.syncId);
        if (this.syncId) {
            return this.pullFromCloud();
        }
        return Promise.resolve(false);
    }

    triggerAutoCloudSync() {
        if (!this.syncId) return;
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
            this.pushToCloud();
        }, 1000);
    }

    // 클라우드 저장 (초고속 KV 스토리지)
    async pushToCloud() {
        if (!this.syncId || this.isSyncing) return;
        try {
            this.isSyncing = true;
            this.updateSyncStatusUI('saving');
            
            const endpoint = `https://kvdb.io/AnE7Z6fL1QW9xUuT2mYp9b/${encodeURIComponent(this.syncId)}`;
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            });

            this.updateSyncStatusUI('synced');
        } catch (e) {
            console.warn("Cloud push failed:", e);
            this.updateSyncStatusUI('error');
        } finally {
            this.isSyncing = false;
        }
    }

    // 클라우드 불러오기 및 스마트 병합
    async pullFromCloud() {
        if (!this.syncId) return false;
        try {
            this.updateSyncStatusUI('syncing');
            const endpoint = `https://kvdb.io/AnE7Z6fL1QW9xUuT2mYp9b/${encodeURIComponent(this.syncId)}`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const cloudData = await res.json();
                if (cloudData && typeof cloudData === 'object') {
                    // 클라우드 데이터가 더 최신이거나 XP가 높으면 병합
                    if (!this.data.updatedAt || (cloudData.updatedAt && cloudData.updatedAt >= this.data.updatedAt) || cloudData.xp > this.data.xp) {
                        this.data = Object.assign(this.getDefaultData(), cloudData);
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
                        this.updateSyncStatusUI('synced');
                        if (window.vocaApp) {
                            window.vocaApp.updateHeaderStats();
                            window.vocaApp.renderRoadmap();
                            window.vocaApp.renderReviewView();
                        }
                        return true;
                    }
                }
            } else if (res.status === 404) {
                // 클라우드에 아직 없으면 현재 로컬 데이터 업로드
                await this.pushToCloud();
                return true;
            }
            this.updateSyncStatusUI('synced');
        } catch (e) {
            console.warn("Cloud pull failed:", e);
            this.updateSyncStatusUI('error');
        }
        return false;
    }

    updateSyncStatusUI(status) {
        const badge = document.getElementById('cloud-sync-status-badge');
        if (!badge) return;
        if (status === 'synced') {
            badge.innerHTML = '🟢 실시간 클라우드 동기화 활성';
            badge.style.color = 'var(--duo-green)';
        } else if (status === 'saving' || status === 'syncing') {
            badge.innerHTML = '🔄 동기화 진행 중...';
            badge.style.color = 'var(--duo-blue)';
        } else if (status === 'error') {
            badge.innerHTML = '⚠️ 오프라인 (로컬 자동 보관)';
            badge.style.color = 'var(--duo-yellow)';
        }
    }

    // 기기 간 백업/복원
    exportBackupCode() {
        return btoa(unescape(encodeURIComponent(JSON.stringify(this.data))));
    }

    importBackupCode(codeStr) {
        try {
            const jsonStr = decodeURIComponent(escape(atob(codeStr.trim())));
            const parsed = JSON.parse(jsonStr);
            if (parsed && typeof parsed === 'object') {
                this.data = Object.assign(this.getDefaultData(), parsed);
                this.saveData();
                return true;
            }
        } catch (e) {
            console.error("Import failed:", e);
        }
        return false;
    }
}

window.srsManager = new SRSManager();
