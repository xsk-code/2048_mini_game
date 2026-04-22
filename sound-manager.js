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

class SoundManager {
  constructor() {
    this.enabled = true;
    this.sounds = {};
    this.initSounds();
    this.loadPreference();
  }

  initSounds() {
    if (typeof wx === 'undefined' || !wx.createInnerAudioContext) {
      return;
    }

    for (const [key, src] of Object.entries(SOUND_CONFIG)) {
      try {
        const audio = wx.createInnerAudioContext();
        audio.src = src;
        this.sounds[key] = audio;
      } catch (e) {
        console.warn(`Failed to create audio for ${key}:`, e);
      }
    }
  }

  play(name, options = {}) {
    if (!this.enabled) return;
    if (!this.sounds[name]) return;

    const audio = this.sounds[name];
    const { volume = 1, playbackRate = 1 } = options;

    try {
      audio.stop();
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.play();
    } catch (e) {
      console.warn(`Failed to play sound ${name}:`, e);
    }
  }

  playElimination(count) {
    if (!this.enabled) return;

    if (count >= 20) {
      this.play('popstar_combo', { volume: 1.0, playbackRate: 1.2 });
      setTimeout(() => {
        this.play('popstar_clear', { volume: 0.7 });
      }, 100);
    } else if (count >= 10) {
      this.play('popstar_combo', { volume: 1.0, playbackRate: 1.1 });
    } else if (count >= 5) {
      this.play('popstar_combo', { volume: 0.8 });
    } else if (count >= 2) {
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

  savePreference() {
    try {
      if (typeof wx !== 'undefined' && wx.setStorageSync) {
        wx.setStorageSync('sound-enabled', this.enabled);
      }
    } catch (e) {
      console.warn('Failed to save sound preference:', e);
    }
  }

  loadPreference() {
    try {
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        const saved = wx.getStorageSync('sound-enabled');
        if (saved !== undefined && saved !== null) {
          this.enabled = saved;
        }
      }
    } catch (e) {
      console.warn('Failed to load sound preference:', e);
    }
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
