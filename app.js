// 독학사 4단계 영어 듀오링고 웹앱 - 2026 최신 4대 퀴즈 & 문맥 예문 빈칸 퀴즈 & 2가지 오답노트 엔진
const SentenceHelper = {
    // 독학사 4단계 빈출 핵심 어휘 맞춤형 실전 예문 사전
    customSentences: {
        'impulse': {
            en: 'He acted on sudden [ _____ ] without thinking about the consequences.',
            ko: '그는 결과를 생각하지 않고 갑작스러운 [ 충동 ]에 따라 행동했다.'
        },
        'virtue': {
            en: 'Patience is considered an essential [ _____ ] in difficult times.',
            ko: '인내는 어려운 시기에 필수적인 [ 미덕 ]으로 여겨진다.'
        },
        'distribute': {
            en: 'The volunteers gathered to [ _____ ] food and emergency supplies.',
            ko: '자원봉사자들은 식량과 비상 구호품을 [ 분배하다 ] 위해 모였다.'
        },
        'extinguish': {
            en: 'Firefighters worked tirelessly to [ _____ ] the blazing fire.',
            ko: '소방관들은 타오르는 불길을 [ 끄다 ] 위해 끊임없이 노력했다.'
        },
        'survive': {
            en: 'Few plants can [ _____ ] in such harsh and freezing conditions.',
            ko: '그런 혹독하고 얼어붙는 환경에서 [ 살아남다 ] 수 있는 식물은 거의 없다.'
        },
        'fortitude': {
            en: 'She endured the long recovery with admirable mental [ _____ ].',
            ko: '그녀는 감탄할 만한 정신적 [ 불굴의 용기/인내 ]로 긴 회복을 견뎌냈다.'
        },
        'fallacy': {
            en: 'It is a common [ _____ ] that wealth always brings true happiness.',
            ko: '부가 항상 진정한 행복을 가져다준다는 것은 흔한 [ 오류/잘못된 생각 ]이다.'
        },
        'revival': {
            en: 'The city experienced an unexpected cultural [ _____ ] this year.',
            ko: '그 도시는 올해 예상치 못한 문화적 [ 부활/부흥 ]을 경험했다.'
        },
        'give up': {
            en: 'You should never [ _____ ] on achieving your lifelong dreams.',
            ko: '당신은 평생의 꿈을 이루는 것을 결코 [ 포기하다 ]해서는 안 된다.'
        },
        'run out of': {
            en: 'We might [ _____ ] time if we do not finish the project soon.',
            ko: '프로젝트를 곧 끝내지 않으면 시간이 [ 바닥나다 ] 수도 있다.'
        }
    },

    getSentence(wordObj) {
        if (!wordObj) return { en: 'Choose the correct word: [ _____ ]', ko: '알맞은 단어를 고르세요.', targetWord: '' };
        const w = (wordObj.word || '').trim();
        const lowerW = w.toLowerCase();

        if (this.customSentences[lowerW]) {
            const item = this.customSentences[lowerW];
            return {
                en: item.en,
                ko: item.ko,
                targetWord: w
            };
        }

        const rawMeaning = (wordObj.meaning || '').split(';')[0].split(',')[0].trim();
        const cleanMeaning = rawMeaning.replace(/[\(\)\[\]]/g, '').trim() || '이 단어';
        const idNum = wordObj.id || 1;

        // 1. 숙어 (2단어 이상 또는 하이픈 포함)
        if (w.includes(' ') || w.includes('-')) {
            const templates = [
                {
                    en: 'You must not [ _____ ] even when faced with serious difficulties.',
                    ko: `심각한 어려움에 직면하더라도 결코 [ ${cleanMeaning} ]해서는 안 된다.`
                },
                {
                    en: 'It took a long time to learn how to [ _____ ] in this situation.',
                    ko: `이러한 상황에서 어떻게 [ ${cleanMeaning} ]하는지 배우는 데 오랜 시간이 걸렸다.`
                },
                {
                    en: 'The professor advised us to [ _____ ] before making a final decision.',
                    ko: `교수님은 최종 결정을 내리기 전에 [ ${cleanMeaning} ]하라고 우리에게 조언했다.`
                }
            ];
            const t = templates[idNum % templates.length];
            return { en: t.en, ko: t.ko, targetWord: w };
        }

        // 2. 동사 (하다, 되다, 시키다, 다)
        if (/([하되]다|시키다|다|타)$/.test(cleanMeaning)) {
            const templates = [
                {
                    en: 'They took immediate action to [ _____ ] the critical situation.',
                    ko: `그들은 위급한 상황을 [ ${cleanMeaning} ]하기 위해 즉각적인 조치를 취했다.`
                },
                {
                    en: 'It is essential to [ _____ ] the given guidelines properly.',
                    ko: `주어진 지침을 올바르게 [ ${cleanMeaning} ]하는 것이 필수적이다.`
                },
                {
                    en: 'We made every effort to [ _____ ] the primary objective.',
                    ko: `우리는 주요 목표를 [ ${cleanMeaning} ]하기 위해 모든 노력을 기울였다.`
                },
                {
                    en: 'Experts gathered to discuss how to [ _____ ] this global challenge.',
                    ko: `전문가들이 모여 이 세계적인 난제를 어떻게 [ ${cleanMeaning} ]할지 논의했다.`
                }
            ];
            const t = templates[idNum % templates.length];
            return { en: t.en, ko: t.ko, targetWord: w };
        }

        // 3. 형용사 (한, 적, 로운, 스러운, 인, 의, 있는)
        if (/([한적의인]|로운|스러운|있는)$/.test(cleanMeaning)) {
            const templates = [
                {
                    en: 'The instructor gave a very [ _____ ] explanation of the topic.',
                    ko: `강사는 그 주제에 대해 매우 [ ${cleanMeaning} ] 설명을 해주었다.`
                },
                {
                    en: 'The company made a [ _____ ] decision for long-term growth.',
                    ko: `그 회사는 장기적인 성장을 위해 [ ${cleanMeaning} ] 결정을 내렸다.`
                },
                {
                    en: 'It was a [ _____ ] moment that had a lasting impact on everyone.',
                    ko: `그것은 모두에게 지속적인 영향을 미친 [ ${cleanMeaning} ] 순간이었다.`
                }
            ];
            const t = templates[idNum % templates.length];
            return { en: t.en, ko: t.ko, targetWord: w };
        }

        // 4. 부사 (하게, 히, 으로)
        if (/(하게|히|으로)$/.test(cleanMeaning)) {
            const templates = [
                {
                    en: 'The task was handled [ _____ ] by our experienced team.',
                    ko: `그 업무는 우리의 숙련된 팀에 의해 [ ${cleanMeaning} ] 처리되었다.`
                },
                {
                    en: 'The entire system operated [ _____ ] throughout the test.',
                    ko: `전체 시스템은 테스트 기간 내내 [ ${cleanMeaning} ] 작동했다.`
                }
            ];
            const t = templates[idNum % templates.length];
            return { en: t.en, ko: t.ko, targetWord: w };
        }

        // 5. 명사 (기본)
        const templates = [
            {
                en: 'Understanding the core concept of [ _____ ] is essential for the test.',
                ko: `시험을 위해서는 [ ${cleanMeaning} ]의 핵심 개념을 이해하는 것이 필수적이다.`
            },
            {
                en: 'She demonstrated exceptional [ _____ ] during the challenging period.',
                ko: `그녀는 힘든 시기 동안 남다른 [ ${cleanMeaning} ]을(를) 보여주었다.`
            },
            {
                en: 'The [ _____ ] was far more significant and influential than expected.',
                ko: `그 [ ${cleanMeaning} ]은(는) 예상했던 것보다 훨씬 더 중요하고 영향력이 컸다.`
            },
            {
                en: 'A clear definition of [ _____ ] helps students solve complex problems.',
                ko: `명확한 [ ${cleanMeaning} ]의 정의는 학생들이 복잡한 문제를 풀도록 돕는다.`
            }
        ];
        const t = templates[idNum % templates.length];
        return { en: t.en, ko: t.ko, targetWord: w };
    }
};

class VocaApp {
    constructor() {
        this.database = window.VOCA_DATABASE || { words: [] };
        this.currentCategoryTab = 'VOCA';
        this.currentView = 'view-path';
        this.currentWrongTab = 'active'; // 'active' (미해결) or 'alltime' (누적보관)
        this.quizSession = null;
        
        this.init();
    }

    init() {
        try {
            if (window.srsManager && typeof window.srsManager.checkUrlSyncImport === 'function') {
                window.srsManager.checkUrlSyncImport();
            }
        } catch (e) { console.warn("Sync check skipped:", e); }

        try { this.updateHeaderStats(); } catch(e) { console.error(e); }
        try { this.setupEventListeners(); } catch(e) { console.error(e); }
        try { this.renderRoadmap(); } catch(e) { console.error(e); }
        try { this.renderVocaList(); } catch(e) { console.error(e); }
        try { this.renderReviewView(); } catch(e) { console.error(e); }
        try { this.checkTheme(); } catch(e) { console.error(e); }
    }

    updateHeaderStats() {
        const srs = window.srsManager;
        srs.updateHearts && srs.updateHearts();

        const streakEl = document.getElementById('header-streak-count');
        const gemEl = document.getElementById('header-gem-count');
        const progressPercentEl = document.getElementById('header-mastery-percent');
        const progressCountEl = document.getElementById('header-mastery-count');

        if (streakEl) streakEl.textContent = srs.data.streak;
        if (gemEl) gemEl.textContent = srs.data.xp;

        const totalWords = this.database.words.length || 2238;
        let masteredWordsCount = 0;
        for (const w of this.database.words) {
            const stat = srs.data.wordStats[w.id];
            if (stat && stat.level >= 1) {
                masteredWordsCount++;
            }
        }

        const percent = ((masteredWordsCount / totalWords) * 100).toFixed(1);
        if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
        if (progressCountEl) progressCountEl.textContent = `(${masteredWordsCount}/${totalWords})`;
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetView = item.dataset.target;
                this.switchView(targetView);
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                window.soundEngine.playPop();
            });
        });

        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategoryTab = tab.dataset.type;
                this.renderRoadmap();
                window.soundEngine.playPop();
            });
        });

        const searchInput = document.getElementById('voca-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderVocaList(e.target.value);
            });
        }

        const syncInput = document.getElementById('input-sync-id');
        const syncBtn = document.getElementById('btn-save-sync-id');
        const shareLinkBtn = document.getElementById('btn-share-cloud-link');

        if (syncInput) {
            syncInput.value = window.srsManager.cloudKey;
            if (window.srsManager.cloudKey) {
                window.srsManager.updateSyncStatusUI('synced');
            }
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', async () => {
                const keyInput = syncInput ? syncInput.value.trim() : '';
                syncBtn.disabled = true;
                syncBtn.textContent = '연결 중...';

                const connectedKey = await window.srsManager.connectCloudKey(keyInput);
                syncBtn.disabled = false;
                syncBtn.textContent = '동기화 연결';

                if (connectedKey) {
                    if (syncInput) syncInput.value = connectedKey;
                    alert(`🎉 클라우드 자동 동기화 연결 완료!\n\n아래 [스마트폰 원클릭 링크 복사]로 폰에 보내시면 100% 자동 동기화됩니다.`);
                } else {
                    alert('⚠️ 동기화 연결에 실패했습니다. 인터넷 연결을 확인해 주세요.');
                }
            });
        }

        if (shareLinkBtn) {
            shareLinkBtn.addEventListener('click', async () => {
                let key = window.srsManager.cloudKey;
                if (!key) {
                    key = await window.srsManager.connectCloudKey('');
                    if (syncInput && key) syncInput.value = key;
                }
                const shareUrl = window.srsManager.getAutoSyncShareUrl();
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('🎉 [스마트폰 원클릭 자동 연동 링크]가 복사되었습니다!\n\n카카오톡으로 나에게 보낸 뒤 스마트폰에서 누르시면 영구 자동 동기화됩니다.');
                });
            });
        }

        const exportBtn = document.getElementById('btn-export-backup');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const code = window.srsManager.exportBackupCode();
                navigator.clipboard.writeText(code).then(() => {
                    alert('🎉 진도 백업 코드가 복사되었습니다!');
                });
            });
        }

        const importBtn = document.getElementById('btn-import-backup');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const code = prompt('복사한 백업 코드를 붙여넣어 주세요:');
                if (code && window.srsManager.importBackupCode(code)) {
                    alert('✅ 진도 동기화 완료!');
                    location.reload();
                }
            });
        }

        const themeBtn = document.getElementById('btn-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                const nextTheme = isDark ? 'light' : 'dark';
                document.body.setAttribute('data-theme', nextTheme);
                localStorage.setItem('DOKHAK_THEME', nextTheme);
                themeBtn.textContent = nextTheme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드';
            });
        }
    }

    checkTheme() {
        const saved = localStorage.getItem('DOKHAK_THEME') || 'light';
        document.body.setAttribute('data-theme', saved);
        const themeBtn = document.getElementById('btn-theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = saved === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드';
        }
    }

    switchView(viewId) {
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active');
            this.currentView = viewId;
        }

        if (viewId === 'view-path') this.renderRoadmap();
        if (viewId === 'view-voca') this.renderVocaList();
        if (viewId === 'view-review') this.renderReviewView();
    }

    // 1. 로드맵 렌더링
    renderRoadmap() {
        const container = document.getElementById('path-nodes-container');
        if (!container) return;
        container.innerHTML = '';

        const isVoca = this.currentCategoryTab === 'VOCA';
        const totalDays = isVoca ? 39 : 21;
        const prefix = isVoca ? 'VOCA ' : 'Idioms ';

        const offsets = [0, 45, 75, 45, 0, -45, -75, -45];

        for (let day = 1; day <= totalDays; day++) {
            const padDay = day < 10 ? `0${day}` : `${day}`;
            const catName = `${prefix}${padDay}`;

            const stageWords = this.database.words.filter(w => w.category === catName);
            const wordCount = stageWords.length;

            const compData = window.srsManager.data.completedDays[catName];
            const isCompleted = !!compData;
            const stars = compData ? '⭐'.repeat(compData.stars) : '';
            const offsetX = offsets[(day - 1) % offsets.length];

            const nodeWrapper = document.createElement('div');
            nodeWrapper.className = 'stage-node-wrapper';
            nodeWrapper.style.transform = `translateX(${offsetX}px)`;

            nodeWrapper.innerHTML = `
                <div class="stage-node ${isCompleted ? 'completed' : ''}" data-category="${catName}">
                    <div style="font-size: 22px;">${isCompleted ? '👑' : '📖'}</div>
                    <div style="font-size: 13px; font-weight:900;">${day}</div>
                    ${stars ? `<div class="stage-stars">${stars}</div>` : ''}
                </div>
                <div class="stage-label" style="${isCompleted ? 'color: var(--duo-yellow-dark); font-weight:900;' : ''}">${catName} (${wordCount}개)</div>
            `;

            nodeWrapper.querySelector('.stage-node').addEventListener('click', () => {
                this.showStageModal(catName, stageWords);
            });

            container.appendChild(nodeWrapper);
        }
    }

    showStageModal(category, words) {
        const modal = document.createElement('div');
        modal.className = 'quiz-overlay active';
        modal.id = 'stage-select-modal';
        modal.style.zIndex = '999';

        modal.innerHTML = `
            <div style="max-width: 480px; width: 92%; background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--card-radius); padding: 22px; box-shadow: 0 12px 30px rgba(0,0,0,0.25); animation: popIn 0.2s ease;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                    <div style="font-size: 22px; font-weight: 900; color: var(--duo-blue);">📖 ${category}</div>
                    <button class="quiz-close-btn" id="btn-close-stage-modal" style="position:static;">✕</button>
                </div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 18px;">총 <strong>${words.length}개</strong> 단어 수록 · 4대 실전 퀴즈로 100% 마스터!</p>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="duo-btn duo-btn-green" id="btn-start-full-quiz" style="padding: 14px; font-size: 15px;">
                        🔥 ${words.length}단어 완벽 마스터 (적응형 2-Step 훈련)
                    </button>
                    <button class="duo-btn duo-btn-purple" id="btn-start-match-quiz" style="padding: 12px; font-size: 14px;">
                        ⚡ 매치 매드니스 (5쌍 타일 짝맞추기 콤보)
                    </button>
                    <button class="duo-btn duo-btn-blue" id="btn-preview-words" style="padding: 11px; font-size: 13px;">
                        📑 단어 목록 먼저 훑어보기 (${words.length}개)
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-stage-modal').onclick = () => modal.remove();
        
        document.getElementById('btn-start-full-quiz').onclick = () => {
            modal.remove();
            this.buildAndStartAdaptiveSession(words, `${category} 마스터`, category);
        };

        document.getElementById('btn-start-match-quiz').onclick = () => {
            modal.remove();
            this.buildAndStartMatchSession(words, `${category} 매치`, category);
        };

        document.getElementById('btn-preview-words').onclick = () => {
            modal.remove();
            this.showWordsPreviewModal(category, words);
        };
    }

    showWordsPreviewModal(category, words) {
        const modal = document.createElement('div');
        modal.className = 'quiz-overlay active';
        modal.id = 'words-preview-modal';
        modal.style.zIndex = '999';

        modal.innerHTML = `
            <div style="max-width: 520px; width: 95%; height: 85vh; background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--card-radius); padding: 20px; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">
                    <div>
                        <div style="font-size: 20px; font-weight: 900; color: var(--duo-blue);">${category} 단어 목록</div>
                        <div style="font-size: 12px; color: var(--text-muted);">총 ${words.length}개 단어 수록</div>
                    </div>
                    <button class="quiz-close-btn" id="btn-close-preview-modal" style="position:static;">✕</button>
                </div>
                
                <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
                    ${words.map((w, idx) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-body); padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border-color);">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 12px; font-weight: 900; color: var(--text-muted); width: 20px;">${idx + 1}</span>
                                <div>
                                    <div style="font-size: 16px; font-weight: 900; color: var(--text-main);">${w.word}</div>
                                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600;">${w.meaning}</div>
                                </div>
                            </div>
                            <button class="hero-speaker-btn" style="width:34px; height:34px; font-size:15px;" onclick="window.soundEngine.speak('${w.word.replace(/'/g, "\\'")}')">🔊</button>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 14px; padding-top: 10px; border-top: 2px solid var(--border-color);">
                    <button class="duo-btn duo-btn-green" id="btn-start-from-preview" style="width: 100%; font-size: 16px;">
                        🔥 ${words.length}개 퀴즈 시작하기
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-preview-modal').onclick = () => modal.remove();
        document.getElementById('btn-start-from-preview').onclick = () => {
            modal.remove();
            this.buildAndStartAdaptiveSession(words, `${category} 마스터`, category);
        };
    }

    // 적응형 퀴즈 큐 생성기 (정규 챕터용)
    buildAndStartAdaptiveSession(wordList, sessionTitle, rawCategory = null) {
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        const quizQueue = [];

        shuffled.forEach((w, idx) => {
            if (idx % 3 === 0) {
                quizQueue.push({ type: 'ox', word: w });
            } else {
                quizQueue.push({ type: 'en_to_ko', word: w });
            }
        });

        const shuffled2 = [...wordList].sort(() => 0.5 - Math.random());
        shuffled2.forEach(w => {
            quizQueue.push({ type: 'ko_to_en', word: w });
        });

        const finalQueue = [];
        let matchBatch = [];
        quizQueue.forEach((q, idx) => {
            finalQueue.push(q);
            matchBatch.push(q.word);

            if (matchBatch.length >= 5 && (idx + 1) % 12 === 0) {
                finalQueue.push({ type: 'match_5', words: [...matchBatch.slice(0, 5)] });
                matchBatch = [];
            }
        });

        this.startQuizSession(finalQueue, sessionTitle, wordList.length, rawCategory, false);
    }

    // 🌟 오답노트 전용 퀴즈 큐 생성기 (문맥 예문 빈칸 퀴즈 필수 포함!)
    buildAndStartWrongNotesSession(wordList, sessionTitle, isActiveWrongSession) {
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        const quizQueue = [];

        shuffled.forEach(w => {
            // 1) 문맥 예문 퀴즈: 문장 속에서 단어를 확실히 체화
            quizQueue.push({ type: 'sentence_blank', word: w });
            // 2) 실전 영-한 4지선다
            quizQueue.push({ type: 'en_to_ko', word: w });
        });

        const finalQueue = [];
        let matchBatch = [];
        quizQueue.forEach((q, idx) => {
            finalQueue.push(q);
            matchBatch.push(q.word);

            if (matchBatch.length >= 5 && (idx + 1) % 10 === 0) {
                finalQueue.push({ type: 'match_5', words: [...matchBatch.slice(0, 5)] });
                matchBatch = [];
            }
        });

        this.startQuizSession(finalQueue, sessionTitle, wordList.length, null, isActiveWrongSession);
    }

    buildAndStartMatchSession(wordList, sessionTitle, rawCategory = null) {
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        const finalQueue = [];
        
        for (let i = 0; i < shuffled.length; i += 5) {
            const batch = shuffled.slice(i, i + 5);
            if (batch.length >= 2) {
                finalQueue.push({ type: 'match_5', words: batch });
            }
        }

        this.startQuizSession(finalQueue, sessionTitle, wordList.length, rawCategory, false);
    }

    startQuizSession(queue, title, targetWordCount, rawCategory = null, isActiveWrongSession = false) {
        const overlay = document.getElementById('quiz-modal');
        overlay.classList.add('active');

        this.quizSession = {
            title: title,
            rawCategory: rawCategory,
            isActiveWrongSession: isActiveWrongSession,
            items: queue,
            currentIndex: 0,
            score: 0,
            combo: 0,
            maxCombo: 0,
            initialTotal: targetWordCount || queue.length,
            completedCount: 0
        };

        this.renderNextQuestion();
    }

    closeQuiz() {
        const overlay = document.getElementById('quiz-modal');
        overlay.classList.remove('active');
        this.quizSession = null;
        this.hideFeedbackBanner();
        this.updateHeaderStats();
        this.renderRoadmap();
        this.renderReviewView();
    }

    renderNextQuestion() {
        this.hideFeedbackBanner();
        const session = this.quizSession;
        if (!session || session.currentIndex >= session.items.length) {
            this.finishQuizSession();
            return;
        }

        const progressPercent = Math.min(100, (session.currentIndex / session.items.length) * 100);
        document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

        const currentItem = session.items[session.currentIndex];
        const quizBody = document.getElementById('quiz-body-container');
        quizBody.innerHTML = '';

        const headerInfo = document.createElement('div');
        headerInfo.style.cssText = 'display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:8px; font-size:12px; font-weight:800; color:var(--text-muted);';
        headerInfo.innerHTML = `
            <div>문제 ${session.currentIndex + 1} / ${session.items.length}</div>
            <div style="color:var(--duo-yellow); font-size:13px;">${session.combo >= 2 ? `🔥 ${session.combo} 콤보!` : ''}</div>
        `;
        quizBody.appendChild(headerInfo);

        if (currentItem.type === 'sentence_blank') {
            this.renderSentenceBlankQuiz(quizBody, currentItem.word);
        } else if (currentItem.type === 'en_to_ko') {
            this.renderEnToKoQuiz(quizBody, currentItem.word);
        } else if (currentItem.type === 'ko_to_en') {
            this.renderKoToEnQuiz(quizBody, currentItem.word);
        } else if (currentItem.type === 'ox') {
            this.renderOXSpeedQuiz(quizBody, currentItem.word);
        } else if (currentItem.type === 'match_5') {
            this.renderMatch5Quiz(quizBody, currentItem.words);
        }
    }

    // ================= 🌟 문맥 예문 빈칸 퀴즈 (신규 추가) =================
    renderSentenceBlankQuiz(container, targetWord) {
        const sData = SentenceHelper.getSentence(targetWord);
        const allOtherWords = this.database.words.filter(w => w.id !== targetWord.id);
        const wrongDistractors = allOtherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [targetWord, ...wrongDistractors].sort(() => 0.5 - Math.random());

        let selectedOption = null;

        const content = document.createElement('div');
        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div class="quiz-prompt-title" style="margin-bottom:0; color:var(--duo-purple);">📝 문맥 예문 완성 (빈칸에 알맞은 단어)</div>
                <button class="duo-btn duo-btn-outline" id="btn-dont-know" style="padding:5px 12px; font-size:12px; font-weight:800; border-radius:10px;">🤔 몰라요</button>
            </div>
            
            <div class="quiz-word-hero sentence-quiz-hero" style="padding:20px; text-align:left; align-items:flex-start;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:10px;">
                    <span style="font-size:12px; font-weight:900; color:var(--duo-purple); background:rgba(168,85,247,0.15); padding:3px 8px; border-radius:6px;">실전 문맥 예문</span>
                    <button class="hero-speaker-btn" id="hero-tts-sentence-btn" style="width:36px; height:36px; font-size:16px;" title="문장 전체 발음 듣기">🔊</button>
                </div>
                
                <div class="sentence-en-text" id="sentence-en-display" style="font-size:18px; font-weight:800; line-height:1.5; color:var(--text-main); margin-bottom:12px; width:100%;">
                    ${sData.en.replace('[ _____ ]', `<span class="sentence-blank-badge" id="blank-placeholder">[ ? ]</span>`)}
                </div>
                
                <div class="sentence-ko-text" style="font-size:14px; color:var(--text-muted); font-weight:600; line-height:1.4; border-top:1px dashed var(--border-color); padding-top:10px; width:100%;">
                    ${sData.ko}
                </div>
            </div>

            <div class="choice-list" style="margin-top:16px;">
                ${options.map((opt, idx) => `
                    <div class="choice-card sentence-choice" data-word-id="${opt.id}">
                        <span style="font-size:16px; font-weight:900;">${opt.word}</span>
                        <span style="color: var(--border-color); font-weight:900;">${idx + 1}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(content);

        // TTS: 문장 전체 발음 스트리밍
        const fullSentenceToSpeak = sData.en.replace('[ _____ ]', targetWord.word);
        document.getElementById('hero-tts-sentence-btn').onclick = () => {
            window.soundEngine.speak(fullSentenceToSpeak);
        };
        setTimeout(() => window.soundEngine.speak(fullSentenceToSpeak), 150);

        document.getElementById('btn-dont-know').onclick = () => {
            const placeholder = document.getElementById('blank-placeholder');
            if (placeholder) {
                placeholder.textContent = targetWord.word;
                placeholder.className = 'sentence-blank-badge badge-wrong';
            }
            window.soundEngine.speak(targetWord.word);
            this.handleSingleAnswerResult(false, targetWord, 'sentence_blank');
        };

        const cards = container.querySelectorAll('.choice-card');
        cards.forEach(card => {
            card.onclick = () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedOption = parseInt(card.dataset.wordId);
                window.soundEngine.playPop();

                this.showCheckButton(() => {
                    const isRight = selectedOption === targetWord.id;
                    const placeholder = document.getElementById('blank-placeholder');
                    if (placeholder) {
                        placeholder.textContent = targetWord.word;
                        placeholder.className = `sentence-blank-badge ${isRight ? 'badge-correct' : 'badge-wrong'}`;
                    }
                    window.soundEngine.speak(targetWord.word);
                    this.handleSingleAnswerResult(isRight, targetWord, 'sentence_blank');
                });
            };
        });
    }

    // ================= 1. 영 ➔ 한 4지선다 =================
    renderEnToKoQuiz(container, targetWord) {
        const allOtherWords = this.database.words.filter(w => w.id !== targetWord.id);
        const wrongDistractors = allOtherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [targetWord, ...wrongDistractors].sort(() => 0.5 - Math.random());

        let selectedOption = null;

        const content = document.createElement('div');
        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div class="quiz-prompt-title" style="margin-bottom:0;">알맞은 한국어 뜻을 선택하세요</div>
                <button class="duo-btn duo-btn-outline" id="btn-dont-know" style="padding:5px 12px; font-size:12px; font-weight:800; border-radius:10px;">🤔 몰라요</button>
            </div>
            <div class="quiz-word-hero">
                <div class="hero-word">${targetWord.word}</div>
                <button class="hero-speaker-btn" id="hero-tts-btn">🔊</button>
            </div>
            <div class="choice-list">
                ${options.map((opt, idx) => `
                    <div class="choice-card" data-word-id="${opt.id}">
                        <span>${opt.meaning}</span>
                        <span style="color: var(--border-color); font-weight:900;">${idx + 1}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(content);

        document.getElementById('hero-tts-btn').onclick = () => window.soundEngine.speak(targetWord.word);
        setTimeout(() => window.soundEngine.speak(targetWord.word), 150);

        document.getElementById('btn-dont-know').onclick = () => {
            this.handleSingleAnswerResult(false, targetWord, 'ko_to_en');
        };

        const cards = container.querySelectorAll('.choice-card');
        cards.forEach(card => {
            card.onclick = () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedOption = parseInt(card.dataset.wordId);
                window.soundEngine.playPop();

                this.showCheckButton(() => {
                    const isRight = selectedOption === targetWord.id;
                    this.handleSingleAnswerResult(isRight, targetWord, 'ko_to_en');
                });
            };
        });
    }

    // ================= 2. 한 ➔ 영 4지선다 =================
    renderKoToEnQuiz(container, targetWord) {
        const allOtherWords = this.database.words.filter(w => w.id !== targetWord.id);
        const wrongDistractors = allOtherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [targetWord, ...wrongDistractors].sort(() => 0.5 - Math.random());

        let selectedOption = null;

        const content = document.createElement('div');
        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div class="quiz-prompt-title" style="margin-bottom:0;">알맞은 영단어를 선택하세요</div>
                <button class="duo-btn duo-btn-outline" id="btn-dont-know" style="padding:5px 12px; font-size:12px; font-weight:800; border-radius:10px;">🤔 몰라요</button>
            </div>
            <div class="quiz-word-hero" style="background: linear-gradient(135deg, rgba(28,176,246,0.1), rgba(28,176,246,0.02));">
                <div class="hero-word" style="font-size: 22px; color: var(--duo-blue);">${targetWord.meaning}</div>
            </div>
            <div class="choice-list">
                ${options.map((opt, idx) => `
                    <div class="choice-card" data-word-id="${opt.id}">
                        <span style="font-size:17px; font-weight:900;">${opt.word}</span>
                        <span style="color: var(--border-color); font-weight:900;">${idx + 1}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(content);

        document.getElementById('btn-dont-know').onclick = () => {
            window.soundEngine.speak(targetWord.word);
            this.handleSingleAnswerResult(false, targetWord, 'en_to_ko');
        };

        const cards = container.querySelectorAll('.choice-card');
        cards.forEach(card => {
            card.onclick = () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedOption = parseInt(card.dataset.wordId);
                window.soundEngine.playPop();

                this.showCheckButton(() => {
                    const isRight = selectedOption === targetWord.id;
                    window.soundEngine.speak(targetWord.word);
                    this.handleSingleAnswerResult(isRight, targetWord, 'en_to_ko');
                });
            };
        });
    }

    // ================= 3. ⭕❌ 1초 판별 =================
    renderOXSpeedQuiz(container, targetWord) {
        const isTrueQuestion = Math.random() < 0.5;
        let displayedMeaning = targetWord.meaning;
        if (!isTrueQuestion) {
            const others = this.database.words.filter(w => w.id !== targetWord.id);
            const randomOther = others[Math.floor(Math.random() * others.length)];
            displayedMeaning = randomOther.meaning;
        }

        const content = document.createElement('div');
        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div class="quiz-prompt-title" style="margin-bottom:0;">이 단어의 뜻이 맞습니까? (1초 판별)</div>
                <button class="duo-btn duo-btn-outline" id="btn-dont-know" style="padding:5px 12px; font-size:12px; font-weight:800; border-radius:10px;">🤔 몰라요</button>
            </div>
            <div class="quiz-word-hero">
                <div class="hero-word">${targetWord.word}</div>
                <div style="font-size: 18px; color: var(--duo-blue); font-weight: 800; margin-top: 6px;">= ${displayedMeaning}</div>
                <button class="hero-speaker-btn" id="hero-tts-btn" style="margin-top:10px;">🔊</button>
            </div>
            <div style="display:flex; gap:16px; width:100%; max-width:400px; margin-top:24px;">
                <button class="duo-btn duo-btn-red" id="btn-ox-false" style="flex:1; padding:18px; font-size:24px; font-weight:900;">❌ 틀림</button>
                <button class="duo-btn duo-btn-green" id="btn-ox-true" style="flex:1; padding:18px; font-size:24px; font-weight:900;">⭕ 맞음</button>
            </div>
        `;
        container.appendChild(content);

        document.getElementById('hero-tts-btn').onclick = () => window.soundEngine.speak(targetWord.word);
        setTimeout(() => window.soundEngine.speak(targetWord.word), 150);

        document.getElementById('btn-dont-know').onclick = () => {
            this.handleSingleAnswerResult(false, targetWord, 'ko_to_en');
        };

        document.getElementById('btn-ox-true').onclick = () => {
            const isRight = isTrueQuestion === true;
            this.handleSingleAnswerResult(isRight, targetWord, 'ko_to_en');
        };

        document.getElementById('btn-ox-false').onclick = () => {
            const isRight = isTrueQuestion === false;
            this.handleSingleAnswerResult(isRight, targetWord, 'en_to_ko');
        };
    }

    // ================= 4. ⚡ 5쌍 매치 매드니스 =================
    renderMatch5Quiz(container, words) {
        const pairs = [...words];
        const enTiles = pairs.map(w => ({ id: w.id, text: w.word, type: 'en' })).sort(() => 0.5 - Math.random());
        const koTiles = pairs.map(w => ({ id: w.id, text: w.meaning, type: 'ko' })).sort(() => 0.5 - Math.random());

        let selectedEn = null;
        let selectedKo = null;
        let matchedCount = 0;

        const content = document.createElement('div');
        content.innerHTML = `
            <div class="quiz-prompt-title" style="color:var(--duo-purple);">⚡ 매치 매드니스! 영단어와 뜻의 짝을 맞추세요</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; width:100%; max-width:450px; margin-top:16px;" id="match-grid">
                <div style="display:flex; flex-direction:column; gap:10px;" id="match-en-col">
                    ${enTiles.map(t => `
                        <div class="choice-card match-tile" data-id="${t.id}" data-type="en" style="padding:14px; font-size:15px; font-weight:900; justify-content:center; text-align:center;">
                            ${t.text}
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;" id="match-ko-col">
                    ${koTiles.map(t => `
                        <div class="choice-card match-tile" data-id="${t.id}" data-type="ko" style="padding:14px; font-size:13px; font-weight:800; justify-content:center; text-align:center;">
                            ${t.text}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(content);

        const checkMatch = () => {
            if (selectedEn && selectedKo) {
                const enId = parseInt(selectedEn.dataset.id);
                const koId = parseInt(selectedKo.dataset.id);

                if (enId === koId) {
                    window.soundEngine.playPop();
                    window.soundEngine.playCombo(matchedCount + 1);
                    selectedEn.style.visibility = 'hidden';
                    selectedKo.style.visibility = 'hidden';
                    matchedCount++;

                    selectedEn = null;
                    selectedKo = null;

                    if (matchedCount === pairs.length) {
                        window.soundEngine.playCorrect();
                        this.quizSession.score += pairs.length;
                        this.quizSession.combo += pairs.length;

                        pairs.forEach(w => window.srsManager.recordRight(w.id, this.quizSession.isActiveWrongSession));

                        setTimeout(() => {
                            this.quizSession.currentIndex++;
                            this.renderNextQuestion();
                        }, 500);
                    }
                } else {
                    window.soundEngine.playWrong();
                    selectedEn.classList.add('wrong-shake');
                    selectedKo.classList.add('wrong-shake');
                    setTimeout(() => {
                        selectedEn.classList.remove('wrong-shake', 'selected');
                        selectedKo.classList.remove('wrong-shake', 'selected');
                        selectedEn = null;
                        selectedKo = null;
                    }, 400);
                }
            }
        };

        content.querySelectorAll('.match-tile').forEach(tile => {
            tile.onclick = () => {
                const type = tile.dataset.type;
                if (type === 'en') {
                    content.querySelectorAll('[data-type="en"]').forEach(t => t.classList.remove('selected'));
                    tile.classList.add('selected');
                    selectedEn = tile;
                    window.soundEngine.playPop();
                } else {
                    content.querySelectorAll('[data-type="ko"]').forEach(t => t.classList.remove('selected'));
                    tile.classList.add('selected');
                    selectedKo = tile;
                    window.soundEngine.playPop();
                }
                checkMatch();
            };
        });
    }

    showCheckButton(onCheck) {
        const footer = document.getElementById('quiz-footer');
        footer.className = 'quiz-footer-banner';
        footer.innerHTML = `
            <button class="duo-btn duo-btn-green" id="btn-check-answer">확인</button>
        `;
        document.getElementById('btn-check-answer').onclick = () => onCheck();
    }

    handleSingleAnswerResult(isRight, targetWord, retryType = 'sentence_blank') {
        const footer = document.getElementById('quiz-footer');
        const session = this.quizSession;

        if (isRight) {
            session.score++;
            session.combo++;
            if (session.combo > session.maxCombo) session.maxCombo = session.combo;

            window.soundEngine.playCorrect();
            if (session.combo >= 2) window.soundEngine.playCombo(session.combo);
            
            // 🌟 isActiveWrongSession이 true일 때만 '미해결 오답노트'에서 삭제됨!
            window.srsManager.recordRight(targetWord.id, session.isActiveWrongSession);

            footer.className = 'quiz-footer-banner banner-correct';
            footer.innerHTML = `
                <div class="banner-message-row">
                    <div class="banner-icon">🎉</div>
                    <div>
                        <div class="banner-title">정답입니다!</div>
                        <div class="banner-subtitle">${targetWord.word} : ${targetWord.meaning}</div>
                    </div>
                </div>
                <button class="duo-btn duo-btn-green" id="btn-next-q">계속하기</button>
            `;
        } else {
            session.combo = 0;
            window.soundEngine.playWrong();
            window.srsManager.recordWrong(targetWord.id);

            session.items.push({ type: retryType, word: targetWord });

            footer.className = 'quiz-footer-banner banner-wrong';
            footer.innerHTML = `
                <div class="banner-message-row">
                    <div class="banner-icon">💡</div>
                    <div>
                        <div class="banner-title">정답: ${targetWord.word}</div>
                        <div class="banner-subtitle">${targetWord.meaning} (세션 끝에 재출제!)</div>
                    </div>
                </div>
                <button class="duo-btn duo-btn-yellow" id="btn-next-q">계속하기</button>
            `;
        }

        document.getElementById('btn-next-q').onclick = () => {
            session.currentIndex++;
            this.renderNextQuestion();
        };
    }

    hideFeedbackBanner() {
        const footer = document.getElementById('quiz-footer');
        footer.className = 'quiz-footer-banner';
        footer.innerHTML = '';
    }

    finishQuizSession() {
        const session = this.quizSession;
        window.soundEngine.playFanfare();

        const targetCategory = session.rawCategory || (session.title.startsWith('VOCA') || session.title.startsWith('Idioms') ? session.title.split(' ')[0] + ' ' + session.title.split(' ')[1] : session.title);
        window.srsManager.recordStageComplete(targetCategory, session.score, session.initialTotal);

        this.updateHeaderStats();

        const quizBody = document.getElementById('quiz-body-container');
        quizBody.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; animation: popIn 0.3s ease;">
                <div style="font-size: 64px; margin-bottom: 12px;">🏆</div>
                <h2 style="font-size: 26px; font-weight: 900; margin-bottom: 6px; color: var(--duo-green);">완벽 마스터 달성!</h2>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">${session.title}의 모든 단어를 완벽하게 훈련했습니다.</p>
                
                <div style="background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--card-radius); padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-around;">
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-green);">${session.initialTotal}개</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">마스터 단어</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-yellow);">🔥 ${session.maxCombo}</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">최대 콤보</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-blue);">+${session.initialTotal * 15} XP</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">경험치</div>
                        </div>
                    </div>
                </div>

                <button class="duo-btn duo-btn-green" id="btn-quiz-done" style="font-size:16px; padding:14px;">멋져요! 계속하기</button>
            </div>
        `;

        document.getElementById('btn-quiz-done').onclick = () => this.closeQuiz();
    }

    // 3. 복습 뷰 렌더링 (2가지 오답노트 모드 & 탭 뷰어)
    renderReviewView() {
        const srs = window.srsManager;
        const dueWords = srs.getDueReviewWords(this.database.words);
        const wrongWords = this.database.words.filter(w => (srs.data.wrongNotes || []).includes(parseInt(w.id)));
        const allTimeWords = this.database.words.filter(w => (srs.data.allTimeWrongNotes || []).includes(parseInt(w.id)));

        const dueEl = document.getElementById('review-due-count');
        const wrongEl = document.getElementById('review-wrong-count');
        const allTimeEl = document.getElementById('review-alltime-wrong-count');
        const tabActiveCount = document.getElementById('tab-active-count');
        const tabAlltimeCount = document.getElementById('tab-alltime-count');

        if (dueEl) dueEl.textContent = `${dueWords.length}개`;
        if (wrongEl) wrongEl.textContent = `${wrongWords.length}개`;
        if (allTimeEl) allTimeEl.textContent = `${allTimeWords.length}개`;
        if (tabActiveCount) tabActiveCount.textContent = wrongWords.length;
        if (tabAlltimeCount) tabAlltimeCount.textContent = allTimeWords.length;

        // 1) 오늘 복습
        const btnDue = document.getElementById('btn-start-due-review');
        if (btnDue) {
            btnDue.onclick = () => {
                if (dueWords.length === 0) {
                    alert('🎉 오늘 복습할 단어가 없습니다! 멋져요.');
                    return;
                }
                this.buildAndStartAdaptiveSession(dueWords, '오늘의 SRS 복습');
            };
        }

        // 2) 미해결 오답 격파 (맞추면 삭제되는 모드)
        const btnWrong = document.getElementById('btn-start-wrong-review');
        if (btnWrong) {
            btnWrong.onclick = () => {
                if (wrongWords.length === 0) {
                    alert('👏 현재 미해결 오답이 없습니다! 모든 오답을 정복하셨습니다.');
                    return;
                }
                this.buildAndStartWrongNotesSession(wrongWords, '🚨 미해결 오답 격파', true);
            };
        }

        // 3) 누적 오답 총복습 (영구 보관 모드)
        const btnAllTime = document.getElementById('btn-start-alltime-wrong-review');
        if (btnAllTime) {
            btnAllTime.onclick = () => {
                if (allTimeWords.length === 0) {
                    alert('👏 아직 틀렸던 단어가 없습니다! 멋져요.');
                    return;
                }
                this.buildAndStartWrongNotesSession(allTimeWords, '📜 누적 취약 단어 총복습', false);
            };
        }

        // 4) 오답 단어 목록 탭 스위처
        const tabActive = document.getElementById('tab-show-active-wrong');
        const tabAllTime = document.getElementById('tab-show-alltime-wrong');

        if (tabActive && tabAllTime) {
            tabActive.onclick = () => {
                this.currentWrongTab = 'active';
                tabActive.classList.add('active');
                tabAllTime.classList.remove('active');
                this.renderWrongWordsList(wrongWords, allTimeWords);
                window.soundEngine.playPop();
            };
            tabAllTime.onclick = () => {
                this.currentWrongTab = 'alltime';
                tabAllTime.classList.add('active');
                tabActive.classList.remove('active');
                this.renderWrongWordsList(wrongWords, allTimeWords);
                window.soundEngine.playPop();
            };
        }

        this.renderWrongWordsList(wrongWords, allTimeWords);
    }

    renderWrongWordsList(wrongWords, allTimeWords) {
        const listContainer = document.getElementById('wrong-words-preview-list');
        if (!listContainer) return;

        const targetWords = this.currentWrongTab === 'active' ? wrongWords : allTimeWords;

        if (targetWords.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; color:var(--text-muted); font-size:13px; padding:20px;">
                    ${this.currentWrongTab === 'active' ? '🎉 현재 미해결 오답이 없습니다! 멋져요.' : '📜 아직 틀렸던 단어가 없습니다.'}
                </div>
            `;
            return;
        }

        listContainer.innerHTML = targetWords.slice(0, 150).map((w, idx) => {
            const sData = SentenceHelper.getSentence(w);
            return `
                <div class="wrong-list-item">
                    <div style="flex: 1; padding-right: 8px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                            <span style="font-size:11px; font-weight:800; color:var(--text-muted); width:20px;">${idx + 1}</span>
                            <span style="font-weight:900; font-size:15px; color:${this.currentWrongTab === 'active' ? 'var(--duo-red)' : 'var(--duo-purple)'};">${w.word}</span>
                            <span style="font-size:10px; padding:1px 5px; border-radius:4px; background:var(--border-color); color:var(--text-muted); font-weight:700;">${w.category}</span>
                        </div>
                        <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom:4px;">${w.meaning}</div>
                        <div style="font-size:11px; color:var(--text-muted); font-style:italic;">
                            💡 ${sData.en.replace('[ _____ ]', `<strong>${w.word}</strong>`)}
                        </div>
                    </div>
                    <button class="hero-speaker-btn" style="width:32px; height:32px; font-size:14px; flex-shrink:0;" onclick="window.soundEngine.speak('${w.word.replace(/'/g, "\\'")}')">🔊</button>
                </div>
            `;
        }).join('');
    }

    renderVocaList(searchQuery = '') {
        const listContainer = document.getElementById('voca-items-list');
        if (!listContainer) return;

        let words = this.database.words;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            words = words.filter(w => w.word.toLowerCase().includes(q) || w.meaning.includes(q));
        }

        const badge = document.getElementById('voca-total-badge');
        if (badge) badge.textContent = `총 ${words.length}개`;

        listContainer.innerHTML = words.slice(0, 300).map(w => {
            const numId = parseInt(w.id);
            const isStarred = window.srsManager.data.wordStats[numId]?.starred;
            const isWrong = (window.srsManager.data.wrongNotes || []).includes(numId);
            const isEverWrong = (window.srsManager.data.allTimeWrongNotes || []).includes(numId);
            return `
                <div class="voca-item-card">
                    <div class="voca-item-left">
                        <div class="voca-item-word">
                            <span>${w.word}</span>
                            <span class="voca-item-tag">${w.category}</span>
                            ${isWrong ? `<span style="font-size:11px; background:var(--duo-red); color:#fff; padding:2px 6px; border-radius:6px; font-weight:800;">오답</span>` : (isEverWrong ? `<span style="font-size:11px; background:var(--duo-purple); color:#fff; padding:2px 6px; border-radius:6px; font-weight:800;">취약</span>` : '')}
                        </div>
                        <div class="voca-item-meaning">${w.meaning}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="star-btn ${isStarred ? 'starred' : ''}" data-word-id="${w.id}">★</button>
                        <button class="hero-speaker-btn" style="width:36px; height:36px; font-size:16px;" onclick="window.soundEngine.speak('${w.word.replace(/'/g, "\\'")}')">🔊</button>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.querySelectorAll('.star-btn').forEach(btn => {
            btn.onclick = () => {
                const wid = parseInt(btn.dataset.wordId);
                const starred = window.srsManager.toggleStar(wid);
                btn.classList.toggle('starred', starred);
                window.soundEngine.playPop();
            };
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.vocaApp = new VocaApp();
});
