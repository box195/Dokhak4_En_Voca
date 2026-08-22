// 듀오링고 스타일 신시사이저 사운드 & 최고급 원어민 실제 녹음 MP3 오디오 엔진
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.ttsSpeed = 0.9;
        this.currentAudio = null;
        this.nativeVoice = null;
        this.initAudioContext();
        this.initWebSpeechVoices();
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        } catch (e) {
            console.warn("AudioContext not supported:", e);
        }
    }

    initWebSpeechVoices() {
        if ('speechSynthesis' in window) {
            const updateVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // 미국식/영국식 원어민 순수 영어 음성만 엄격 필터링 (한국어 음성 제외)
                this.nativeVoice = voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en')) && (
                    v.name.includes('Google') || 
                    v.name.includes('Natural') || 
                    v.name.includes('Samantha') || 
                    v.name.includes('Jenny') || 
                    v.name.includes('David') || 
                    v.name.includes('Zira') || 
                    v.name.includes('English')
                )) || voices.find(v => v.lang.startsWith('en'));
            };
            window.speechSynthesis.onvoiceschanged = updateVoices;
            updateVoices();
        }
    }

    resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 부드러운 톤 생성 헬퍼
    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, startDelay = 0) {
        if (!this.soundEnabled || !this.ctx) return;
        this.resumeContext();

        const startTime = this.ctx.currentTime + startDelay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // 1. 듀오링고 정답 사운드 (딩동댕 도-미-솔 멜로디 🎶)
    playCorrect() {
        if (!this.soundEnabled) return;
        this.playTone(523.25, 'triangle', 0.12, 0.25, 0.0);   // C5
        this.playTone(659.25, 'triangle', 0.12, 0.25, 0.08);  // E5
        this.playTone(783.99, 'triangle', 0.25, 0.3, 0.16);   // G5
        this.playTone(1046.50, 'sine', 0.35, 0.2, 0.22);     // C6
    }

    // 2. 오답 사운드 (부드러운 저음 띡~ ❌)
    playWrong() {
        if (!this.soundEnabled) return;
        this.playTone(220.0, 'sawtooth', 0.18, 0.15, 0.0);
        this.playTone(174.61, 'sawtooth', 0.25, 0.15, 0.1);
    }

    // 3. 콤보 피버 사운드 (상승 아르페지오)
    playCombo(comboCount = 1) {
        if (!this.soundEnabled) return;
        const baseFreq = 440 + Math.min(comboCount * 30, 400);
        this.playTone(baseFreq, 'sine', 0.1, 0.2, 0.0);
        this.playTone(baseFreq * 1.25, 'sine', 0.1, 0.2, 0.06);
        this.playTone(baseFreq * 1.5, 'sine', 0.2, 0.25, 0.12);
    }

    // 4. 블록 탭/클릭 톡톡 사운드
    playPop() {
        if (!this.soundEnabled) return;
        this.playTone(800, 'sine', 0.05, 0.15, 0.0);
    }

    // 5. 블록 취소 사운드
    playUnpop() {
        if (!this.soundEnabled) return;
        this.playTone(450, 'sine', 0.05, 0.12, 0.0);
    }

    // 6. 스테이지 클리어 팡파레 🎺
    playFanfare() {
        if (!this.soundEnabled) return;
        const notes = [
            { f: 523.25, d: 0.12, t: 0.0 },
            { f: 523.25, d: 0.12, t: 0.12 },
            { f: 523.25, d: 0.12, t: 0.24 },
            { f: 659.25, d: 0.35, t: 0.36 },
            { f: 783.99, d: 0.2,  t: 0.72 },
            { f: 1046.50, d: 0.5, t: 0.92 }
        ];
        notes.forEach(n => {
            this.playTone(n.f, 'triangle', n.d, 0.3, n.t);
        });
    }

    // 7. 최고급 미국식 원어민 실제 발음 (스튜디오 녹음 MP3 + 네이티브 폴백)
    speak(text) {
        if (!text) return;
        const cleanText = text.replace(/[\(\)\[\]\/\~\*\.\,\:\;]/g, '').trim();
        if (!cleanText) return;

        // 이전 오디오 정지
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // [1순위] 미국식 원어민 스튜디오 고음질 실제 발음 스트림 (type=2: US Native Speaker)
        const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=2`;
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        let playedSuccessfully = false;

        audio.play().then(() => {
            playedSuccessfully = true;
        }).catch(err => {
            console.warn("Native audio stream fallback to Web Speech:", err);
            this.fallbackWebSpeech(cleanText);
        });

        // 타임아웃 1.5초 내 재생 안되면 웹 스피치로 폴백
        setTimeout(() => {
            if (!playedSuccessfully && this.currentAudio === audio) {
                this.fallbackWebSpeech(cleanText);
            }
        }, 1500);
    }

    fallbackWebSpeech(cleanText) {
        if (!('speechSynthesis' in window)) return;
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = 'en-US';
        utter.rate = this.ttsSpeed;

        if (this.nativeVoice) {
            utter.voice = this.nativeVoice;
        } else {
            const voices = window.speechSynthesis.getVoices();
            const enVoice = voices.find(v => v.lang.startsWith('en'));
            if (enVoice) utter.voice = enVoice;
        }

        window.speechSynthesis.speak(utter);
    }
}

window.soundEngine = new SoundEngine();
