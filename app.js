// 독학사 4단계 영어 듀오링고 웹앱 메인 로직 (100% 전수 출제 + 틀린단어 재출제 + 오답노트 마스터)
class VocaApp {
    constructor() {
        this.database = window.VOCA_DATABASE || { words: [] };
        this.currentCategoryTab = 'VOCA'; // 'VOCA' or 'Idioms'
        this.currentView = 'view-path';
        this.quizSession = null;
        this.selectedStageCategory = null;
        
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

    // 상단 헤더 (스트릭, 보석, 하트) UI 업데이트
    updateHeaderStats() {
        const srs = window.srsManager;
        srs.updateHearts();

        const streakEl = document.getElementById('header-streak-count');
        const gemEl = document.getElementById('header-gem-count');
        const heartEl = document.getElementById('header-heart-count');

        if (streakEl) streakEl.textContent = srs.data.streak;
        if (gemEl) gemEl.textContent = srs.data.xp;
        if (heartEl) heartEl.textContent = srs.data.hearts;
    }

    setupEventListeners() {
        // 하단 네비게이션 탭 전환
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetView = item.dataset.target;
                this.switchView(targetView);
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                window.soundEngine.playPop();
            });
        });

        // 로드맵 카테고리 탭 (VOCA vs Idioms)
        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategoryTab = tab.dataset.type;
                this.renderRoadmap();
                window.soundEngine.playPop();
            });
        });

        // 단어장 검색창
        const searchInput = document.getElementById('voca-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderVocaList(e.target.value);
            });
        }

        // 클라우드 자동 동기화 연결 및 링크 공유
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
                    alert(`🎉 클라우드 자동 동기화가 연결되었습니다!\n\n아래 [스마트폰 원클릭 링크 복사] 버튼을 눌러 카카오톡으로 보내시면, 스마트폰에서도 100% 자동 동기화가 활성화됩니다.`);
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
                    alert('🎉 [스마트폰 원클릭 자동 연동 링크]가 복사되었습니다!\n\n카카오톡으로 나에게 보낸 뒤, 스마트폰에서 링크를 누르면 폰에서도 평생 100% 실시간 자동 동기화가 유지됩니다.');
                });
            });
        }

        // 백업 코드 복사 버튼
        const exportBtn = document.getElementById('btn-export-backup');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const code = window.srsManager.exportBackupCode();
                navigator.clipboard.writeText(code).then(() => {
                    alert('🎉 진도 백업 코드가 클립보드에 복사되었습니다!\n다른 기기에서 [진도 불러오기]에 붙여넣으세요.');
                });
            });
        }

        // 백업 코드 가져오기 버튼
        const importBtn = document.getElementById('btn-import-backup');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const code = prompt('복사한 백업 코드를 여기에 붙여넣어 주세요:');
                if (code) {
                    if (window.srsManager.importBackupCode(code)) {
                        alert('✅ 진도 동기화 완료!');
                        location.reload();
                    } else {
                        alert('❌ 유효하지 않은 백업 코드입니다.');
                    }
                }
            });
        }

        // 하트 충전 버튼
        const refillBtn = document.getElementById('btn-refill-hearts');
        if (refillBtn) {
            refillBtn.addEventListener('click', () => {
                window.srsManager.refillHearts();
                this.updateHeaderStats();
                alert('💖 하트가 5개로 완충되었습니다!');
            });
        }

        // 다크모드 토글
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

    // 1. 듀오링고 로드맵 (지그재그 스테이지) 렌더링
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
                    <div style="font-size: 20px;">${isCompleted ? '👑' : '📖'}</div>
                    <div style="font-size: 13px; font-weight:900;">${day}</div>
                    ${stars ? `<div class="stage-stars">${stars}</div>` : ''}
                </div>
                <div class="stage-label">${catName} (${wordCount}개)</div>
            `;

            nodeWrapper.querySelector('.stage-node').addEventListener('click', () => {
                this.showStageModal(catName, stageWords);
            });

            container.appendChild(nodeWrapper);
        }
    }

    // 스테이지 선택 모달 (전체 학습 / 미리보기 / 빠른 풀기)
    showStageModal(category, words) {
        if (window.srsManager.data.hearts <= 0) {
            alert('💔 하트가 부족합니다! 설정 탭에서 충전하거나 30분을 기다려주세요.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'quiz-overlay active';
        modal.id = 'stage-select-modal';
        modal.style.zIndex = '999';

        modal.innerHTML = `
            <div style="max-width: 480px; width: 90%; background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--card-radius); padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.25s ease;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                    <div style="font-size: 22px; font-weight: 900; color: var(--duo-blue);">📖 ${category}</div>
                    <button class="quiz-close-btn" id="btn-close-stage-modal" style="position:static;">✕</button>
                </div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">총 <strong>${words.length}개</strong>의 단어가 수록되어 있습니다. 어떤 방식으로 학습하시겠습니까?</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="duo-btn duo-btn-green" id="btn-start-full-quiz" style="padding: 14px; font-size: 16px;">
                        🔥 ${words.length}개 전체 단어 완벽 마스터 (전수 출제)
                    </button>
                    <button class="duo-btn duo-btn-blue" id="btn-preview-words" style="padding: 12px; font-size: 14px;">
                        📑 단어 목록 먼저 훑어보기 (${words.length}개)
                    </button>
                    <button class="duo-btn duo-btn-outline" id="btn-start-15-quiz" style="padding: 10px; font-size: 13px;">
                        ⚡ 15문제 빠른 훈련 모드
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-stage-modal').onclick = () => modal.remove();
        
        document.getElementById('btn-start-full-quiz').onclick = () => {
            modal.remove();
            this.openQuizOverlay(words, `${category} 전체 마스터`, words.length);
        };

        document.getElementById('btn-start-15-quiz').onclick = () => {
            modal.remove();
            this.openQuizOverlay(words, `${category} 빠른 훈련`, 15);
        };

        document.getElementById('btn-preview-words').onclick = () => {
            modal.remove();
            this.showWordsPreviewModal(category, words);
        };
    }

    // 단어 목록 미리보기 모달
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
                        🔥 ${words.length}개 전체 퀴즈 시작하기
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-preview-modal').onclick = () => modal.remove();
        document.getElementById('btn-start-from-preview').onclick = () => {
            modal.remove();
            this.openQuizOverlay(words, `${category} 전체 마스터`, words.length);
        };
    }

    // 2. 퀴즈 세션 시작 (전수 출제 & 스마트 오답 큐 지원)
    openQuizOverlay(wordList, sessionTitle = '단어 학습', maxCount = null) {
        const overlay = document.getElementById('quiz-modal');
        overlay.classList.add('active');

        // 단어 셔플
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        const totalCount = maxCount ? Math.min(shuffled.length, maxCount) : shuffled.length;
        const quizItems = shuffled.slice(0, totalCount);

        this.quizSession = {
            title: sessionTitle,
            items: quizItems,
            currentIndex: 0,
            score: 0,
            initialTotal: totalCount,
            totalAnswered: 0,
            combo: 0,
            retryQueue: []
        };

        document.getElementById('quiz-heart-val').textContent = window.srsManager.data.hearts;
        this.renderNextQuestion();
    }

    closeQuiz() {
        const overlay = document.getElementById('quiz-modal');
        overlay.classList.remove('active');
        this.quizSession = null;
        this.hideFeedbackBanner();
        this.updateHeaderStats();
        this.renderRoadmap();
    }

    renderNextQuestion() {
        this.hideFeedbackBanner();
        const session = this.quizSession;
        if (!session || session.currentIndex >= session.items.length) {
            this.finishQuizSession();
            return;
        }

        // 프로그레스 바 업데이트 (맞힌 진행률)
        const progressPercent = Math.min(100, (session.currentIndex / session.items.length) * 100);
        document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

        const currentWord = session.items[session.currentIndex];
        const quizBody = document.getElementById('quiz-body-container');
        quizBody.innerHTML = '';

        // 퀴즈 문제 번호 표시
        const qNumBadge = document.createElement('div');
        qNumBadge.style.cssText = 'text-align:center; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px;';
        qNumBadge.textContent = `문제 ${session.currentIndex + 1} / ${session.items.length}`;
        quizBody.appendChild(qNumBadge);

        // 3가지 퀴즈 모드 중 출제
        const quizTypes = ['choice', 'builder', 'flash'];
        const chosenType = quizTypes[session.currentIndex % quizTypes.length];

        if (chosenType === 'builder' && currentWord.word.length >= 3 && currentWord.word.length <= 15 && !currentWord.word.includes('(')) {
            this.renderBuilderQuiz(quizBody, currentWord);
        } else if (chosenType === 'flash') {
            this.renderFlashcardQuiz(quizBody, currentWord);
        } else {
            this.renderChoiceQuiz(quizBody, currentWord);
        }
    }

    // 모드 1: 4지선다 퀴즈
    renderChoiceQuiz(container, targetWord) {
        const allOtherWords = this.database.words.filter(w => w.id !== targetWord.id);
        const wrongDistractors = allOtherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [targetWord, ...wrongDistractors].sort(() => 0.5 - Math.random());

        let selectedOption = null;

        const quizContent = document.createElement('div');
        quizContent.innerHTML = `
            <div class="quiz-prompt-title">알맞은 뜻을 선택하세요</div>
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
        container.appendChild(quizContent);

        document.getElementById('hero-tts-btn').addEventListener('click', () => {
            window.soundEngine.speak(targetWord.word);
        });

        setTimeout(() => window.soundEngine.speak(targetWord.word), 150);

        const choiceCards = container.querySelectorAll('.choice-card');
        choiceCards.forEach(card => {
            card.addEventListener('click', () => {
                choiceCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedOption = parseInt(card.dataset.wordId);
                window.soundEngine.playPop();
                this.showCheckButton(() => {
                    const isRight = selectedOption === targetWord.id;
                    this.handleAnswerResult(isRight, targetWord);
                });
            });
        });
    }

    // 모드 2: 단어 블록 맞추기 (Word Builder)
    renderBuilderQuiz(container, targetWord) {
        const cleanWord = targetWord.word.toLowerCase();
        let pieces = cleanWord.split('');
        if (cleanWord.includes(' ')) {
            pieces = cleanWord.split(' ');
        }
        const shuffledPieces = [...pieces].sort(() => 0.5 - Math.random());
        let assembled = [];

        const quizContent = document.createElement('div');
        quizContent.innerHTML = `
            <div class="quiz-prompt-title">단어 철자를 순서대로 조립하세요</div>
            <div class="quiz-word-hero">
                <div class="hero-word" style="font-size: 22px; color: var(--duo-blue);">${targetWord.meaning}</div>
                <button class="hero-speaker-btn" id="hero-tts-btn">🔊</button>
            </div>
            <div class="builder-slot-area" id="builder-slots"></div>
            <div class="builder-pool-area" id="builder-pool">
                ${shuffledPieces.map((p, idx) => `
                    <div class="word-tile" data-piece="${p}" data-idx="${idx}">${p}</div>
                `).join('')}
            </div>
        `;
        container.appendChild(quizContent);

        document.getElementById('hero-tts-btn').addEventListener('click', () => {
            window.soundEngine.speak(targetWord.word);
        });

        const slotArea = document.getElementById('builder-slots');
        const poolArea = document.getElementById('builder-pool');

        poolArea.querySelectorAll('.word-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                if (tile.classList.contains('used')) return;
                tile.classList.add('used');
                window.soundEngine.playPop();

                const piece = tile.dataset.piece;
                const slotTile = document.createElement('div');
                slotTile.className = 'word-tile';
                slotTile.textContent = piece;
                slotTile.dataset.origIdx = tile.dataset.idx;

                slotTile.addEventListener('click', () => {
                    tile.classList.remove('used');
                    slotTile.remove();
                    window.soundEngine.playUnpop();
                    assembled = assembled.filter(item => item.origIdx !== tile.dataset.idx);
                });

                slotArea.appendChild(slotTile);
                assembled.push({ piece, origIdx: tile.dataset.idx });

                if (assembled.length === pieces.length) {
                    this.showCheckButton(() => {
                        const builtWord = assembled.map(a => a.piece).join(cleanWord.includes(' ') ? ' ' : '');
                        const isRight = builtWord.toLowerCase() === cleanWord;
                        this.handleAnswerResult(isRight, targetWord);
                    });
                }
            });
        });
    }

    // 모드 3: 플래시카드 모드
    renderFlashcardQuiz(container, targetWord) {
        const quizContent = document.createElement('div');
        quizContent.innerHTML = `
            <div class="quiz-prompt-title">카드를 뒤집어 뜻을 확인하세요</div>
            <div class="flashcard-container" id="fc-container">
                <div class="flashcard-inner" id="fc-inner">
                    <div class="flashcard-front">
                        <div style="font-size: 14px; color: var(--text-muted); font-weight:800; margin-bottom:8px;">영어 단어</div>
                        <div class="fc-word">${targetWord.word}</div>
                        <button class="hero-speaker-btn" id="hero-tts-btn" style="margin-top:12px;">🔊</button>
                    </div>
                    <div class="flashcard-back">
                        <div style="font-size: 14px; color: var(--text-muted); font-weight:800; margin-bottom:8px;">한국어 뜻</div>
                        <div class="fc-meaning">${targetWord.meaning}</div>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:12px; width:100%; max-width:400px; margin-top:20px;">
                <button class="duo-btn duo-btn-red" id="btn-fc-hard" style="flex:1;">❌ 아직 헷갈려요</button>
                <button class="duo-btn duo-btn-green" id="btn-fc-easy" style="flex:1;">⭕ 확실히 알아요</button>
            </div>
        `;
        container.appendChild(quizContent);

        const cardInner = document.getElementById('fc-inner');
        cardInner.addEventListener('click', () => {
            cardInner.classList.toggle('flipped');
            window.soundEngine.playPop();
        });

        document.getElementById('hero-tts-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            window.soundEngine.speak(targetWord.word);
        });

        setTimeout(() => window.soundEngine.speak(targetWord.word), 150);

        document.getElementById('btn-fc-easy').addEventListener('click', () => {
            this.handleAnswerResult(true, targetWord);
        });
        document.getElementById('btn-fc-hard').addEventListener('click', () => {
            this.handleAnswerResult(false, targetWord);
        });
    }

    showCheckButton(onCheck) {
        const footer = document.getElementById('quiz-footer');
        footer.className = 'quiz-footer-banner';
        footer.innerHTML = `
            <button class="duo-btn duo-btn-green" id="btn-check-answer">확인</button>
        `;
        document.getElementById('btn-check-answer').addEventListener('click', () => {
            onCheck();
        });
    }

    // 정답/오답 판정 및 틀린 단어 스마트 재출제 큐 등록
    handleAnswerResult(isRight, targetWord) {
        const footer = document.getElementById('quiz-footer');
        const session = this.quizSession;

        if (isRight) {
            session.score++;
            session.combo++;
            window.soundEngine.playCorrect();
            if (session.combo >= 2) {
                window.soundEngine.playCombo(session.combo);
            }
            window.srsManager.recordRight(targetWord.id);

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
            window.srsManager.useHeart();
            document.getElementById('quiz-heart-val').textContent = window.srsManager.data.hearts;

            // 🌟 듀오링고 스마트 오답 재출제: 틀린 단어를 이번 세션 맨 뒤에 다시 삽입!
            session.items.push(targetWord);

            footer.className = 'quiz-footer-banner banner-wrong';
            footer.innerHTML = `
                <div class="banner-message-row">
                    <div class="banner-icon">💡</div>
                    <div>
                        <div class="banner-title">정답: ${targetWord.word}</div>
                        <div class="banner-subtitle">${targetWord.meaning} (세션 끝에 다시 출제됩니다!)</div>
                    </div>
                </div>
                <button class="duo-btn duo-btn-yellow" id="btn-next-q">계속하기</button>
            `;
        }

        document.getElementById('btn-next-q').addEventListener('click', () => {
            session.currentIndex++;
            this.renderNextQuestion();
        });
    }

    hideFeedbackBanner() {
        const footer = document.getElementById('quiz-footer');
        footer.className = 'quiz-footer-banner';
        footer.innerHTML = '';
    }

    finishQuizSession() {
        const session = this.quizSession;
        window.soundEngine.playFanfare();

        // 스테이지 완료 기록
        window.srsManager.recordStageComplete(session.title, session.score, session.initialTotal);

        const quizBody = document.getElementById('quiz-body-container');
        quizBody.innerHTML = `
            <div style="text-align: center; padding: 40px 10px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
                <h2 style="font-size: 26px; font-weight: 900; margin-bottom: 8px;">완벽 마스터 완료!</h2>
                <p style="color: var(--text-muted); font-size: 15px; margin-bottom: 24px;">${session.title}의 모든 단어를 완벽하게 훈련했습니다.</p>
                
                <div style="background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--card-radius); padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-around;">
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-green);">${session.initialTotal} / ${session.initialTotal}</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">마스터한 단어</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-yellow);">+${session.initialTotal * 10} XP</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">획득 경험치</div>
                        </div>
                    </div>
                </div>

                <button class="duo-btn duo-btn-green" id="btn-quiz-done">학습 마치기</button>
            </div>
        `;

        document.getElementById('btn-quiz-done').addEventListener('click', () => {
            this.closeQuiz();
        });
    }

    // 3. 복습 (Review) 뷰 렌더링
    renderReviewView() {
        const srs = window.srsManager;
        const dueWords = srs.getDueReviewWords(this.database.words);
        const wrongWords = this.database.words.filter(w => srs.data.wrongNotes.includes(w.id));

        const dueEl = document.getElementById('review-due-count');
        const wrongEl = document.getElementById('review-wrong-count');

        if (dueEl) dueEl.textContent = `${dueWords.length}개`;
        if (wrongEl) wrongEl.textContent = `${wrongWords.length}개`;

        const btnDue = document.getElementById('btn-start-due-review');
        if (btnDue) {
            btnDue.onclick = () => {
                if (dueWords.length === 0) {
                    alert('🎉 오늘 복습할 단어가 없습니다! 멋져요.');
                    return;
                }
                this.openQuizOverlay(dueWords, '오늘의 SRS 복습', dueWords.length);
            };
        }

        const btnWrong = document.getElementById('btn-start-wrong-review');
        if (btnWrong) {
            btnWrong.onclick = () => {
                if (wrongWords.length === 0) {
                    alert('👏 오답노트가 비어있습니다! 틀린 단어가 없습니다.');
                    return;
                }
                this.openQuizOverlay(wrongWords, '🚨 오답노트 집중 훈련', wrongWords.length);
            };
        }
    }

    // 4. 단어장 (Vocabulary) 뷰 렌더링
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
            const isStarred = window.srsManager.data.wordStats[w.id]?.starred;
            const isWrong = window.srsManager.data.wrongNotes.includes(w.id);
            return `
                <div class="voca-item-card">
                    <div class="voca-item-left">
                        <div class="voca-item-word">
                            <span>${w.word}</span>
                            <span class="voca-item-tag">${w.category}</span>
                            ${isWrong ? `<span style="font-size:11px; background:var(--duo-red); color:#fff; padding:2px 6px; border-radius:6px; font-weight:800;">오답</span>` : ''}
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
            btn.addEventListener('click', () => {
                const wid = parseInt(btn.dataset.wordId);
                const starred = window.srsManager.toggleStar(wid);
                btn.classList.toggle('starred', starred);
                window.soundEngine.playPop();
            });
        });
    }
}

// DOM 로드 시 앱 기동
document.addEventListener('DOMContentLoaded', () => {
    window.vocaApp = new VocaApp();
});
