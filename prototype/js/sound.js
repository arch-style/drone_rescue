// サウンドマネージャークラス
class SoundManager {
    constructor() {
        this.sounds = {};
        this.bgm = null;
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.5;
        this.enabled = true;
        
        // Web Audio APIコンテキスト
        this.audioContext = null;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API is not supported');
            this.enabled = false;
        }
    }
    
    // 効果音を生成
    createSounds() {
        if (!this.enabled) return;
        
        // 救助音
        this.sounds.rescue = this.createTone(800, 0.1, 'sine', 0.2);
        
        // 降下音
        this.sounds.dropOff = this.createTone(600, 0.2, 'sine', 0.3);
        
        // 充電音
        this.sounds.charge = this.createNoise(0.5, 0.3);
        
        // 墜落音
        this.sounds.crash = this.createNoise(1.0, 0.5);
        
        // ボタンクリック音
        this.sounds.click = this.createTone(400, 0.05, 'square', 0.1);
        
        // パワーアップ音
        this.sounds.powerup = this.createArpeggio([400, 500, 600, 800], 0.1);
        
        // ロープ展開音
        this.sounds.rope = this.createTone(300, 0.1, 'sawtooth', 0.1);
    }
    
    // 単音を生成
    createTone(frequency, duration, type = 'sine', fadeTime = 0.1) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume, now + duration - fadeTime);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        };
    }
    
    // ノイズを生成
    createNoise(duration, volume) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            noise.buffer = buffer;
            noise.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(volume * this.sfxVolume, now);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            noise.start(now);
        };
    }
    
    // アルペジオを生成
    createArpeggio(frequencies, duration) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    this.createTone(freq, duration, 'sine', 0.05)();
                }, index * duration * 1000 / frequencies.length);
            });
        };
    }
    
    // BGMを生成して再生
    playBGM() {
        if (!this.enabled || !this.audioContext) return;
        
        // シンプルなBGMパターンを生成
        const playNote = (frequency, time, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.3, time + 0.05);
            gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.3, time + duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, time + duration);
            
            oscillator.start(time);
            oscillator.stop(time + duration);
        };
        
        // BGMループ
        const loop = () => {
            if (!this.enabled) return;
            
            const now = this.audioContext.currentTime;
            const tempo = 0.5; // 秒単位のテンポ
            
            // ベースライン
            const bassNotes = [110, 110, 130.81, 130.81, 87.31, 87.31, 130.81, 130.81];
            bassNotes.forEach((note, i) => {
                playNote(note, now + i * tempo, tempo * 0.9);
            });
            
            // メロディ
            const melodyNotes = [220, 0, 261.63, 220, 174.61, 0, 220, 261.63];
            melodyNotes.forEach((note, i) => {
                if (note > 0) {
                    playNote(note, now + i * tempo, tempo * 0.7);
                }
            });
            
            // 8拍後にループ
            this.bgmTimeout = setTimeout(loop, 8 * tempo * 1000);
        };
        
        loop();
    }
    
    // BGMを停止
    stopBGM() {
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
    }
    
    // 効果音を再生
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            this.sounds[soundName]();
        } catch (e) {
            console.warn('Failed to play sound:', soundName);
        }
    }
    
    // 音量設定
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 有効/無効切り替え
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopBGM();
        }
    }
}