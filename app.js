class VocaApp {
    constructor() {
        this.database = window.VOCA_DATABASE || { words: [] };
        this.currentCategoryTab = 'VOCA'; // 'VOCA' or 'Idioms'
        this.currentView = 'view-path';
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

    // 상단 헤더 (스트릭, 보석, 하트) UI 업데이트
    updateHeaderStats() {
        const srs = window.srsManager;
        srs.updateHearts();

        document.getElementById('header-streak-count').textContent = srs.data.streak;
        document.getElementById('header-gem-count').textContent = srs.data.xp;
        document.getElementById('header-heart-count').textContent = srs.data.hearts;
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
                    // 키가 없으면 즉시 자동 발급
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
        document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active');
            this.currentView = viewId;
        }
        if (viewId === 'view-review') this.renderReviewView();
        if (viewId === 'view-voca') this.renderVocaList();
        if (viewId === 'view-compare') this.renderCompareView(this.currentComparePage || 1);
        this.updateHeaderStats();
    }

    // 5. 원본 이미지 대조 & 검수기 뷰 로직
    renderCompareView(pageNum = 1) {
        this.currentComparePage = pageNum;
        const selectBox = document.getElementById('select-compare-page');
        const imgPreview = document.getElementById('compare-preview-img');
        const titleEl = document.getElementById('compare-page-title');
        const listContainer = document.getElementById('compare-words-list');

        if (!selectBox || !listContainer) return;

        // 드롭다운 옵션 채우기 (처음 1회)
        if (selectBox.children.length === 0) {
            for (let i = 1; i <= 60; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                const prefix = i <= 39 ? `VOCA ${String(i).padStart(2, '0')}` : `Idioms ${String(i - 39).padStart(2, '0')}`;
                opt.textContent = `Page ${String(i).padStart(2, '0')} (${prefix})`;
                selectBox.appendChild(opt);
            }

            selectBox.addEventListener('change', (e) => {
                this.renderCompareView(parseInt(e.target.value));
            });

            document.getElementById('btn-prev-page').addEventListener('click', () => {
                if (this.currentComparePage > 1) {
                    this.renderCompareView(this.currentComparePage - 1);
                }
            });

            document.getElementById('btn-next-page').addEventListener('click', () => {
                if (this.currentComparePage < 60) {
                    this.renderCompareView(this.currentComparePage + 1);
                }
            });

            document.getElementById('btn-save-page-edits').addEventListener('click', () => {
                this.saveComparePageEdits();
            });
        }

        selectBox.value = pageNum;
        const pageStr = String(pageNum).padStart(3, '0');
        imgPreview.src = `voca_captures/page_${pageStr}.png`;

        const prefix = pageNum <= 39 ? `VOCA ${String(pageNum).padStart(2, '0')}` : `Idioms ${String(pageNum - 39).padStart(2, '0')}`;
        titleEl.textContent = `Page ${pageStr} (${prefix}) 단어 목록`;

        // 해당 페이지의 단어들 필터링
        const pageWords = this.database.words.filter(w => w.page === pageNum);

        listContainer.innerHTML = pageWords.map((w, idx) => `
            <div class="compare-row" data-word-id="${w.id}">
                <span class="compare-num">${idx + 1}</span>
                <input type="text" class="edit-input-word" value="${w.word.replace(/"/g, '&quot;')}" placeholder="영어 단어">
                <input type="text" class="edit-input-meaning" value="${w.meaning.replace(/"/g, '&quot;')}" placeholder="한국어 뜻">
                <button class="hero-speaker-btn" style="width:32px; height:32px; font-size:14px;" onclick="window.soundEngine.speak('${w.word.replace(/'/g, "\\'")}')">🔊</button>
            </div>
        `).join('');
    }

    saveComparePageEdits() {
        const rows = document.querySelectorAll('.compare-row');
        let editedCount = 0;

        rows.forEach(row => {
            const wid = parseInt(row.dataset.wordId);
            const wordInput = row.querySelector('.edit-input-word').value.trim();
            const meaningInput = row.querySelector('.edit-input-meaning').value.trim();

            const target = this.database.words.find(w => w.id === wid);
            if (target) {
                if (target.word !== wordInput || target.meaning !== meaningInput) {
                    target.word = wordInput;
                    target.meaning = meaningInput;
                    editedCount++;
                }
            }
        });

        // 로컬스토리지에 커스텀 DB 상태 저장
        localStorage.setItem('DOKHAK_CUSTOM_WORDS_DB', JSON.stringify(this.database.words));
        window.soundEngine.playCorrect();
        alert(`💾 Page ${this.currentComparePage}의 수정사항 ${editedCount}개가 안전하게 저장되었습니다!`);
    }


    // 1. 로드맵 렌더링
    renderRoadmap() {
        const container = document.getElementById('path-nodes-container');
        if (!container) return;
        container.innerHTML = '';

        const isVoca = this.currentCategoryTab === 'VOCA';
        const totalDays = isVoca ? 39 : 21;
        const prefix = isVoca ? 'VOCA' : 'Idioms';

        for (let day = 1; day <= totalDays; day++) {
            const catName = `${prefix} ${String(day).padStart(2, '0')}`;
            const completedInfo = window.srsManager.data.completedDays[catName];
            const isCompleted = !!completedInfo;
            const stars = isCompleted ? '⭐'.repeat(completedInfo.stars) : '';

            // 지그재그 오프셋 계산 (듀오링고 특유의 S자 곡선)
            const offsets = [0, 40, 65, 40, 0, -40, -65, -40];
            const offsetX = offsets[(day - 1) % offsets.length];

            const nodeWrapper = document.createElement('div');
            nodeWrapper.className = 'stage-node-wrapper';
            nodeWrapper.style.transform = `translateX(${offsetX}px)`;

            nodeWrapper.innerHTML = `
                <div class="stage-node ${isCompleted ? 'completed' : ''}" data-category="${catName}">
                    <div style="font-size: 20px;">${isCompleted ? '👑' : '📖'}</div>
                    <div style="font-size: 13px;">${day}</div>
                    ${stars ? `<div class="stage-stars">${stars}</div>` : ''}
                </div>
                <div class="stage-label">${catName}</div>
            `;

            nodeWrapper.querySelector('.stage-node').addEventListener('click', () => {
                this.startStageQuiz(catName);
            });

            container.appendChild(nodeWrapper);
        }
    }

    // 2. 퀴즈 세션 시작
    startStageQuiz(category) {
        // 하트 확인
        if (window.srsManager.data.hearts <= 0) {
            alert('💔 하트가 부족합니다! 복습 탭에서 충전하거나 30분을 기다려주세요.');
            return;
        }

        // 해당 카테고리의 단어들 필터링
        const stageWords = this.database.words.filter(w => w.category === category);
        if (stageWords.length === 0) {
            alert('해당 챕터의 단어를 찾을 수 없습니다.');
            return;
        }

        this.openQuizOverlay(stageWords, category);
    }

    openQuizOverlay(wordList, sessionTitle = '단어 학습') {
        const overlay = document.getElementById('quiz-modal');
        overlay.classList.add('active');

        // 퀴즈 문제 셋 생성 (셔플)
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        const sessionCount = Math.min(shuffled.length, 10); // 한 세션당 10문제
        const quizItems = shuffled.slice(0, sessionCount);

        this.quizSession = {
            title: sessionTitle,
            items: quizItems,
            currentIndex: 0,
            score: 0,
            total: sessionCount,
            combo: 0
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
        if (!session || session.currentIndex >= session.total) {
            this.finishQuizSession();
            return;
        }

        // 프로그레스 바 업데이트
        const progressPercent = (session.currentIndex / session.total) * 100;
        document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

        const currentWord = session.items[session.currentIndex];
        const quizBody = document.getElementById('quiz-body-container');
        quizBody.innerHTML = '';

        // 3가지 퀴즈 모드 중 랜덤 또는 단어 특성에 맞게 선택
        // 1) 단어 블록 맞추기 (Word Builder)
        // 2) 4지선다 객관식 (Choice)
        // 3) 스펠링 / 플래시
        const quizTypes = ['choice', 'builder', 'flash'];
        const chosenType = quizTypes[session.currentIndex % quizTypes.length];

        if (chosenType === 'builder' && currentWord.word.length >= 3 && currentWord.word.length <= 15) {
            this.renderBuilderQuiz(quizBody, currentWord);
        } else if (chosenType === 'flash') {
            this.renderFlashcardQuiz(quizBody, currentWord);
        } else {
            this.renderChoiceQuiz(quizBody, currentWord);
        }
    }

    // 모드 1: 4지선다 퀴즈
    renderChoiceQuiz(container, targetWord) {
        // 보기 4개 생성 (정답 1개 + 오답 3개)
        const allOtherWords = this.database.words.filter(w => w.id !== targetWord.id);
        const wrongDistractors = allOtherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [targetWord, ...wrongDistractors].sort(() => 0.5 - Math.random());

        let selectedOption = null;

        container.innerHTML = `
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

        document.getElementById('hero-tts-btn').addEventListener('click', () => {
            window.soundEngine.speak(targetWord.word);
        });

        // 자동 1회 발음
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

    // 모드 2: 듀오링고 단어 블록 맞추기 (Word Builder)
    renderBuilderQuiz(container, targetWord) {
        const cleanWord = targetWord.word.toLowerCase();
        // 철자 조각 또는 단어 단위 쪼개기
        let pieces = cleanWord.split('');
        if (cleanWord.includes(' ')) {
            pieces = cleanWord.split(' ');
        }
        const shuffledPieces = [...pieces].sort(() => 0.5 - Math.random());
        let assembled = [];

        container.innerHTML = `
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
                assembled.push({ piece: piece, origIdx: tile.dataset.idx });

                // 조립 완료 시 확인 버튼
                if (assembled.length === pieces.length) {
                    this.showCheckButton(() => {
                        const userStr = assembled.map(a => a.piece).join(cleanWord.includes(' ') ? ' ' : '');
                        const isRight = userStr === cleanWord;
                        this.handleAnswerResult(isRight, targetWord);
                    });
                }
            });
        });
    }

    // 모드 3: 3D 플래시카드 모드
    renderFlashcardQuiz(container, targetWord) {
        container.innerHTML = `
            <div class="quiz-prompt-title">카드를 탭하여 뜻을 확인하세요</div>
            <div class="flashcard-3d-wrapper">
                <div class="flashcard-inner" id="fc-inner">
                    <div class="flashcard-face flashcard-front">
                        <div style="font-size: 32px; font-weight: 900; margin-bottom: 12px;">${targetWord.word}</div>
                        <button class="hero-speaker-btn" id="hero-tts-btn">🔊</button>
                        <div style="margin-top: 24px; font-size: 13px; color: var(--text-muted);">👉 탭해서 뒤집기</div>
                    </div>
                    <div class="flashcard-face flashcard-back">
                        <div style="font-size: 24px; font-weight: 900; color: var(--duo-green); margin-bottom: 12px;">${targetWord.meaning}</div>
                        <div style="font-size: 14px; color: var(--text-muted);">${targetWord.category}</div>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 10px;">
                <button class="duo-btn duo-btn-outline" id="btn-fc-hard" style="flex:1;">❌ 몰라요</button>
                <button class="duo-btn duo-btn-green" id="btn-fc-easy" style="flex:1;">⭕ 알아요</button>
            </div>
        `;

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

            footer.className = 'quiz-footer-banner banner-wrong';
            footer.innerHTML = `
                <div class="banner-message-row">
                    <div class="banner-icon">💡</div>
                    <div>
                        <div class="banner-title">정답: ${targetWord.word}</div>
                        <div class="banner-subtitle">${targetWord.meaning}</div>
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
        window.srsManager.recordStageComplete(session.title, session.score, session.total);

        const quizBody = document.getElementById('quiz-body-container');
        quizBody.innerHTML = `
            <div style="text-align: center; padding: 40px 10px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
                <h2 style="font-size: 26px; font-weight: 900; margin-bottom: 8px;">학습 완료!</h2>
                <p style="color: var(--text-muted); font-size: 15px; margin-bottom: 24px;">${session.title} 챕터를 멋지게 완료했습니다.</p>
                
                <div style="background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--card-radius); padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-around;">
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-green);">${session.score} / ${session.total}</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">맞힌 문제</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 900; color: var(--duo-yellow);">+${session.score * 10} XP</div>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 800;">획득 경험치</div>
                        </div>
                    </div>
                </div>

                <button class="duo-btn duo-btn-green" id="btn-quiz-done">홈으로 돌아가기</button>
            </div>
        `;

        this.hideFeedbackBanner();
        document.getElementById('btn-quiz-done').addEventListener('click', () => {
            this.closeQuiz();
        });
    }

    // 3. 복습 (Review) 뷰 렌더링
    renderReviewView() {
        const srs = window.srsManager;
        const dueWords = srs.getDueReviewWords(this.database.words);
        const wrongWords = this.database.words.filter(w => srs.data.wrongNotes.includes(w.id));

        document.getElementById('review-due-count').textContent = `${dueWords.length}개`;
        document.getElementById('review-wrong-count').textContent = `${wrongWords.length}개`;

        const btnDue = document.getElementById('btn-start-due-review');
        if (btnDue) {
            btnDue.onclick = () => {
                if (dueWords.length === 0) {
                    alert('🎉 오늘 복습할 단어가 없습니다! 멋져요.');
                    return;
                }
                this.openQuizOverlay(dueWords, '오늘의 SRS 복습');
            };
        }

        const btnWrong = document.getElementById('btn-start-wrong-review');
        if (btnWrong) {
            btnWrong.onclick = () => {
                if (wrongWords.length === 0) {
                    alert('👏 오답노트가 비어있습니다!');
                    return;
                }
                this.openQuizOverlay(wrongWords, '오답노트 집중 훈련');
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

        document.getElementById('voca-total-badge').textContent = `총 ${words.length}개`;

        // 300개 단위 렌더링
        listContainer.innerHTML = words.slice(0, 300).map(w => {
            const isStarred = window.srsManager.data.wordStats[w.id]?.starred;
            return `
                <div class="voca-item-card">
                    <div class="voca-item-left">
                        <div class="voca-item-word">
                            <span>${w.word}</span>
                            <span class="voca-item-tag">${w.category}</span>
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
