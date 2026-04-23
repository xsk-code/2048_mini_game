const SOUND_CONFIG = {
  popstar_tap: 'audio/popstar_tap.mp3',
  popstar_eliminate: 'audio/popstar_eliminate.mp3',
  popstar_combo: 'audio/popstar_combo.mp3',
  popstar_fall: 'audio/popstar_fall.mp3',
  popstar_clear: 'audio/popstar_clear.mp3',
  popstar_gameover: 'audio/popstar_gameover.mp3',
  merge_2048: 'audio/merge_2048.mp3',
  gameover_2048: 'audio/gameover_2048.mp3',
  button_click: 'audio/button_click.mp3'
};

function isWeChatEnvironment() {
  return typeof wx !== 'undefined' && wx.createInnerAudioContext;
}

function isBrowserEnvironment() {
  return typeof Audio !== 'undefined' || (typeof window !== 'undefined' && window.Audio);
}

class SoundManager {
  constructor() {
    this.enabled = true;
    this.sounds = {};
    this.env = this.detectEnvironment();
    this.initSounds();
    this.loadPreference();
  }

  detectEnvironment() {
    if (isWeChatEnvironment()) {
      return 'wechat';
    } else if (isBrowserEnvironment()) {
      return 'browser';
    }
    return 'none';
  }

  initSounds() {
    if (this.env === 'wechat') {
      this.initWeChatSounds();
    } else if (this.env === 'browser') {
      this.initBrowserSounds();
    }
  }

  initWeChatSounds() {
    for (const [key, src] of Object.entries(SOUND_CONFIG)) {
      try {
        const audio = wx.createInnerAudioContext();
        audio.src = src;
        this.sounds[key] = audio;
      } catch (e) {
        console.warn(`Failed to create wechat audio for ${key}:`, e);
      }
    }
  }

  initBrowserSounds() {
    const AudioClass = typeof Audio !== 'undefined' ? Audio : window.Audio;
    for (const [key, src] of Object.entries(SOUND_CONFIG)) {
      try {
        const audio = new AudioClass();
        audio.src = src;
        audio.preload = 'auto';
        this.sounds[key] = audio;
      } catch (e) {
        console.warn(`Failed to create browser audio for ${key}:`, e);
      }
    }
  }

  play(name, options = {}) {
    if (!this.enabled) return;
    if (!this.sounds[name]) return;

    const audio = this.sounds[name];
    const { volume = 1, playbackRate = 1 } = options;

    try {
      if (this.env === 'wechat') {
        this.playWeChatAudio(audio, volume, playbackRate);
      } else if (this.env === 'browser') {
        this.playBrowserAudio(audio, volume, playbackRate);
      }
    } catch (e) {
      console.warn(`Failed to play sound ${name}:`, e);
    }
  }

  playWeChatAudio(audio, volume, playbackRate) {
    audio.stop();
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.play();
  }

  playBrowserAudio(audio, volume, playbackRate) {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.log('Audio play failed, user interaction required:', e);
        });
      }
    } catch (e) {
      console.warn('Browser audio play error:', e);
    }
  }

  playElimination(count) {
    if (!this.enabled) return;

    if (count >= 2) {
      this.play('popstar_eliminate', { volume: 0.6 });
    }
  }

  playTap() {
    this.play('popstar_tap', { volume: 0.5 });
  }

  playFall() {
    this.play('popstar_fall', { volume: 0.5 });
  }

  playLevelClear() {
    this.play('popstar_clear', { volume: 1.0 });
  }

  playPopstarGameOver() {
    this.play('popstar_gameover', { volume: 1.0 });
  }

  play2048Merge() {
    this.play('merge_2048', { volume: 0.8 });
  }

  play2048GameOver() {
    this.play('gameover_2048', { volume: 1.0 });
  }

  playButtonClick() {
    this.play('button_click', { volume: 0.7 });
  }

  toggle() {
    this.enabled = !this.enabled;
    this.savePreference();
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  getStorageAdapter() {
    if (this.env === 'wechat' && typeof wx !== 'undefined') {
      return {
        get: (key) => wx.getStorageSync(key),
        set: (key, value) => wx.setStorageSync(key, value)
      };
    } else if (this.env === 'browser' && typeof localStorage !== 'undefined') {
      return {
        get: (key) => localStorage.getItem(key),
        set: (key, value) => localStorage.setItem(key, value)
      };
    }
    return null;
  }

  savePreference() {
    try {
      const storage = this.getStorageAdapter();
      if (storage) {
        storage.set('sound-enabled', this.enabled);
      }
    } catch (e) {
      console.warn('Failed to save sound preference:', e);
    }
  }

  loadPreference() {
    try {
      const storage = this.getStorageAdapter();
      if (storage) {
        const saved = storage.get('sound-enabled');
        if (saved !== undefined && saved !== null) {
          if (typeof saved === 'string') {
            this.enabled = saved === 'true';
          } else {
            this.enabled = saved;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load sound preference:', e);
    }
  }

  getEnvironment() {
    return this.env;
  }
}

let soundManagerInstance = null;

function getSoundManager() {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

module.exports = {
  SoundManager,
  getSoundManager,
  SOUND_CONFIG
};
