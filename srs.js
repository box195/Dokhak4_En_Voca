// 에빙하우스 망각곡선 기반 간격 반복 시스템 (SRS) & 100% 완전 자동 실시간 클라우드 동기화 엔진
class SRSManager {
    constructor() {
        this.STORAGE_KEY = 'DOKHAK_VOCA_USER_DATA_V1';
        this.SYNC_ID_KEY = 'DOKHAK_CLOUD_SYNC_ID';
        this.OBJECT_ID_KEY = 'DOKHAK_CLOUD_OBJECT_ID';
        
        this.syncId = localStorage.getItem(this.SYNC_ID_KEY) || '';
        this.cloudObjectId = localStorage.getItem(this.OBJECT_ID_KEY) || '';
        this.syncDebounceTimer = null;
        this.isSyncing = false;
        
        this.data = this.loadData();
        
        // 앱 실행 시 클라우드 자동 풀링
        if (this.syncId) {
            this.pullFromCloud();
        }

        // 화면 탭 전환/복귀 시 자동 풀링 (스마트폰에서 다시 앱 켤 때)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.syncId) {
                this.pullFromCloud();
            }
        });
    }

    getDefaultData() {
        return {
            hearts: 5,
            maxHearts: 5,
            lastHeartTime: Date.now(),
            xp: 0,
            streak: 1,
            lastStudyDate: new Date().toISOString().split('T')[0],
            completedDays: {},
            wordStats: {},
            wrongNotes: [],
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
        const RECHARGE_INTERVAL = 30 * 60 * 1000;
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

    getIntervalDays(level) {
        const intervals = [1, 2, 4, 7, 14, 30];
        return intervals[Math.min(level, intervals.length - 1)];
    }

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

    toggleStar(wordId) {
        if (!this.data.wordStats[wordId]) {
            this.data.wordStats[wordId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        this.data.wordStats[wordId].starred = !this.data.wordStats[wordId].starred;
        this.saveData();
        return this.data.wordStats[wordId].starred;
    }

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

    // ================= ☁️ 100% 완전 자동 실시간 클라우드 동기화 =================
    async setSyncId(id) {
        this.syncId = id.trim().toLowerCase();
        localStorage.setItem(this.SYNC_ID_KEY, this.syncId);
        if (this.syncId) {
            return await this.pullFromCloud();
        }
        return false;
    }

    triggerAutoCloudSync() {
        if (!this.syncId) return;
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
            this.pushToCloud();
        }, 800);
    }

    // 클라우드 자동 저장 (PUT 또는 POST)
    async pushToCloud() {
        if (!this.syncId || this.isSyncing) return;
        try {
            this.isSyncing = true;
            this.updateSyncStatusUI('saving');

            const payload = {
                name: `dokhak_voca_user_${this.syncId}`,
                data: this.data
            };

            if (this.cloudObjectId) {
                // 기존 객체에 PUT
                const res = await fetch(`https://api.restful-api.dev/objects/${this.cloudObjectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    this.updateSyncStatusUI('synced');
                    return;
                }
            }

            // 없거나 실패 시 새로 생성
            const resNew = await fetch('https://api.restful-api.dev/objects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (resNew.ok) {
                const resData = await resNew.json();
                this.cloudObjectId = resData.id;
                localStorage.setItem(this.OBJECT_ID_KEY, this.cloudObjectId);
                this.updateSyncStatusUI('synced');
            }
        } catch (e) {
            console.warn("Cloud push failed:", e);
            this.updateSyncStatusUI('error');
        } finally {
            this.isSyncing = false;
        }
    }

    // 클라우드 자동 불러오기 & 화면 갱신
    async pullFromCloud() {
        if (!this.syncId) return false;
        try {
            this.updateSyncStatusUI('syncing');

            // 1. 객체 ID가 있으면 직접 조회
            if (this.cloudObjectId) {
                const res = await fetch(`https://api.restful-api.dev/objects/${this.cloudObjectId}`);
                if (res.ok) {
                    const item = await res.json();
                    if (item && item.data) {
                        return this.mergeCloudData(item.data);
                    }
                }
            }

            // 2. 없으면 객체 새로 생성/푸시
            await this.pushToCloud();
            return true;
        } catch (e) {
            console.warn("Cloud pull failed:", e);
            this.updateSyncStatusUI('error');
        }
        return false;
    }

    mergeCloudData(cloudData) {
        if (!cloudData || typeof cloudData !== 'object') return false;

        // 클라우드 진도가 더 최신이거나 더 높은 점수일 때 병합
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
        this.updateSyncStatusUI('synced');
        return false;
    }

    updateSyncStatusUI(status) {
        const badge = document.getElementById('cloud-sync-status-badge');
        if (!badge) return;
        if (status === 'synced') {
            badge.innerHTML = '🟢 실시간 클라우드 자동 동기화 활성';
            badge.style.color = 'var(--duo-green)';
        } else if (status === 'saving' || status === 'syncing') {
            badge.innerHTML = '🔄 실시간 동기화 중...';
            badge.style.color = 'var(--duo-blue)';
        } else if (status === 'error') {
            badge.innerHTML = '⚠️ 오프라인 모드 (로컬 자동 보관)';
            badge.style.color = 'var(--duo-yellow)';
        }
    }

    // 원클릭 진도 동기화 URL 링크 생성
    exportSyncLink() {
        const code = this.exportBackupCode();
        const base = window.location.origin + window.location.pathname;
        return `${base}#sync=${code}`;
    }

    checkUrlSyncImport() {
        if (window.location.hash && window.location.hash.includes('#sync=')) {
            const code = window.location.hash.split('#sync=')[1];
            if (code) {
                if (this.importBackupCode(code)) {
                    history.replaceState(null, null, window.location.pathname);
                    alert('🎉 진도 동기화 완료!\n최신 학습 기록이 성공적으로 반영되었습니다.');
                    return true;
                }
            }
        }
        return false;
    }

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
