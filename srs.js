// 에빙하우스 망각곡선 기반 간격 반복 시스템 (SRS) & 완벽한 오답노트 영구 보존 엔진
class SRSManager {
    constructor() {
        this.STORAGE_KEY = 'DOKHAK_VOCA_USER_DATA_V1';
        this.CLOUD_KEY_STORAGE = 'DOKHAK_CLOUD_SYNC_KEY';
        
        this.cloudKey = localStorage.getItem(this.CLOUD_KEY_STORAGE) || '';
        this.syncDebounceTimer = null;
        this.isSyncing = false;
        
        this.data = this.loadData();
        
        this.checkUrlCloudKey();

        if (this.cloudKey) {
            this.pullFromCloud();
        }

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.cloudKey) {
                this.pullFromCloud();
            }
        });
    }

    getDefaultData() {
        return {
            xp: 0,
            streak: 1,
            lastStudyDate: new Date().toISOString().split('T')[0],
            completedDays: {}, // { "VOCA 01": { stars: 3, score: 100, completedAt: ... } }
            wordStats: {},     // { "word_id": { level: 0~5, nextReview: timestamp, wrongCount: 0, rightCount: 0, starred: false } }
            wrongNotes: [],    // [ 1, 5, 12 ... ] 틀린 단어 ID 정수 배열
            updatedAt: Date.now()
        };
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const merged = Object.assign(this.getDefaultData(), parsed);
                // wrongNotes 배열 정수 정규화
                if (Array.isArray(merged.wrongNotes)) {
                    merged.wrongNotes = merged.wrongNotes.map(id => parseInt(id)).filter(id => !isNaN(id));
                }
                return merged;
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

    // 단어 정답 처리 (isFromWrongSession: 오답노트 집중 훈련에서 맞혔을 때만 오답노트에서 삭제!)
    recordRight(wordId, isFromWrongSession = false) {
        const numId = parseInt(wordId);
        if (isNaN(numId)) return;

        if (!this.data.wordStats[numId]) {
            this.data.wordStats[numId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        const stat = this.data.wordStats[numId];
        stat.rightCount++;
        stat.level = Math.min(stat.level + 1, 5);
        
        const days = this.getIntervalDays(stat.level);
        stat.nextReview = Date.now() + (days * 24 * 60 * 60 * 1000);

        // 🌟 오답노트 집중 훈련에서 맞혔을 때만 오답노트에서 제거!
        if (isFromWrongSession) {
            const idx = this.data.wrongNotes.indexOf(numId);
            if (idx !== -1) {
                this.data.wrongNotes.splice(idx, 1);
            }
        }

        this.addXP(10);
        this.saveData();
    }

    // 단어 오답 처리 (오답노트에 영구 등록)
    recordWrong(wordId) {
        const numId = parseInt(wordId);
        if (isNaN(numId)) return;

        if (!this.data.wordStats[numId]) {
            this.data.wordStats[numId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        const stat = this.data.wordStats[numId];
        stat.wrongCount++;
        stat.level = Math.max(0, stat.level - 1);
        stat.nextReview = Date.now() + (12 * 60 * 60 * 1000);

        // 오답노트에 중복 없이 추가
        if (!this.data.wrongNotes.includes(numId)) {
            this.data.wrongNotes.push(numId);
        }

        this.saveData();
    }

    toggleStar(wordId) {
        const numId = parseInt(wordId);
        if (isNaN(numId)) return false;

        if (!this.data.wordStats[numId]) {
            this.data.wordStats[numId] = { level: 0, rightCount: 0, wrongCount: 0, starred: false, nextReview: 0 };
        }
        this.data.wordStats[numId].starred = !this.data.wordStats[numId].starred;
        this.saveData();
        return this.data.wordStats[numId].starred;
    }

    recordStageComplete(category, score, total) {
        if (!category) return;
        const ratio = total > 0 ? (score / total) : 1;
        let stars = 3; // 완벽 마스터 시 3성 부여
        if (ratio < 0.7) stars = 2;
        if (ratio < 0.5) stars = 1;

        const prev = this.data.completedDays[category];
        if (!prev || stars >= prev.stars) {
            this.data.completedDays[category] = {
                stars: stars,
                score: score,
                total: total,
                completedAt: Date.now()
            };
        }
        this.addXP(100);
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

    // ================= ☁️ 초고속 실시간 클라우드 자동 동기화 =================
    async connectCloudKey(keyInput) {
        let key = keyInput ? keyInput.trim() : '';
        this.updateSyncStatusUI('syncing');

        try {
            if (!key) {
                const payload = {
                    name: "dokhak_voca_cloud_slot",
                    data: this.data
                };
                const res = await fetch('https://api.restful-api.dev/objects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const resData = await res.json();
                    key = resData.id;
                }
            } else {
                const res = await fetch(`https://api.restful-api.dev/objects/${key}`);
                if (res.ok) {
                    const item = await res.json();
                    if (item && item.data) {
                        this.mergeCloudData(item.data);
                    }
                } else {
                    const payload = { name: "dokhak_voca_cloud_slot", data: this.data };
                    const resNew = await fetch('https://api.restful-api.dev/objects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (resNew.ok) {
                        const resData = await resNew.json();
                        key = resData.id;
                    }
                }
            }

            if (key) {
                this.cloudKey = key;
                localStorage.setItem(this.CLOUD_KEY_STORAGE, key);
                this.updateSyncStatusUI('synced');
                return key;
            }
        } catch (e) {
            console.warn("Cloud connection failed:", e);
            this.updateSyncStatusUI('error');
        }
        return null;
    }

    triggerAutoCloudSync() {
        if (!this.cloudKey) return;
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
            this.pushToCloud();
        }, 500);
    }

    async pushToCloud() {
        if (!this.cloudKey || this.isSyncing) return;
        try {
            this.isSyncing = true;
            this.updateSyncStatusUI('saving');

            const payload = {
                name: "dokhak_voca_cloud_slot",
                data: this.data
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`https://api.restful-api.dev/objects/${this.cloudKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                this.updateSyncStatusUI('synced');
            } else {
                this.updateSyncStatusUI('error');
            }
        } catch (e) {
            console.warn("Cloud push error:", e);
            this.updateSyncStatusUI('error');
        } finally {
            this.isSyncing = false;
        }
    }

    async pullFromCloud() {
        if (!this.cloudKey) return false;
        try {
            this.updateSyncStatusUI('syncing');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`https://api.restful-api.dev/objects/${this.cloudKey}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const item = await res.json();
                if (item && item.data) {
                    return this.mergeCloudData(item.data);
                }
            }
            this.updateSyncStatusUI('synced');
        } catch (e) {
            console.warn("Cloud pull error:", e);
            this.updateSyncStatusUI('error');
        }
        return false;
    }

    mergeCloudData(cloudData) {
        if (!cloudData || typeof cloudData !== 'object') return false;

        if (!this.data.updatedAt || (cloudData.updatedAt && cloudData.updatedAt >= this.data.updatedAt) || cloudData.xp > this.data.xp) {
            this.data = Object.assign(this.getDefaultData(), cloudData);
            if (Array.isArray(this.data.wrongNotes)) {
                this.data.wrongNotes = this.data.wrongNotes.map(id => parseInt(id)).filter(id => !isNaN(id));
            }
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
            badge.innerHTML = '⚠️ 오프라인 보관 중 (다시 켜면 자동 연동)';
            badge.style.color = 'var(--duo-yellow)';
        }
    }

    checkUrlCloudKey() {
        if (window.location.hash && window.location.hash.includes('#cloud=')) {
            const key = window.location.hash.split('#cloud=')[1].split('&')[0];
            if (key) {
                this.cloudKey = key;
                localStorage.setItem(this.CLOUD_KEY_STORAGE, key);
                history.replaceState(null, null, window.location.pathname);
                alert('🎉 클라우드 자동 동기화가 연결되었습니다!\n이제부터 PC와 폰의 진도가 100% 자동 동기화됩니다.');
            }
        }
    }

    checkUrlSyncImport() {
        this.checkUrlCloudKey();
    }

    getAutoSyncShareUrl() {
        const base = window.location.origin + window.location.pathname;
        if (!this.cloudKey) return base;
        return `${base}#cloud=${this.cloudKey}`;
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
                if (Array.isArray(this.data.wrongNotes)) {
                    this.data.wrongNotes = this.data.wrongNotes.map(id => parseInt(id)).filter(id => !isNaN(id));
                }
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
