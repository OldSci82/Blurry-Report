import { SAVE_KEY } from '../utils/constants.js';
import { STARTER_CHARACTER_IDS } from '../data/characters.js';

/**
 * Handles all permanent progression and save/load via localStorage.
 * Everything else in the game should talk to this manager — never touch storage directly.
 */
class ProgressionManager {
  constructor() {
    this.data = this.getDefaultSave();
    this.load();
  }

  getDefaultSave() {
    return {
      version: 1,
      unlockedCharacters: [...STARTER_CHARACTER_IDS], // all starters available
      unlockedWeapons: ['machete', 'ancient_tome', 'truth_light', 'word_of_power', 'research_notes', 'giant_slayer'],
      highScores: {
        bestWave: 0,
        bestScore: 0,
        bestTime: 0
      },
      discoveredPowerUps: [],
      discoveredUpgrades: [],
      totalRuns: 0,
      lastCharacter: 'tim_alberino'
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Simple migration guard
        if (parsed.version === this.data.version) {
          this.data = { ...this.getDefaultSave(), ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load save, using defaults', e);
      this.data = this.getDefaultSave();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to write save', e);
    }
  }

  // --- Public API ---

  getUnlockedCharacters() {
    return this.data.unlockedCharacters;
  }

  isCharacterUnlocked(id) {
    return this.data.unlockedCharacters.includes(id);
  }

  unlockCharacter(id) {
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      this.save();
    }
  }

  getHighScores() {
    return { ...this.data.highScores };
  }

  updateHighScores({ wave, score, time }) {
    let changed = false;
    if (wave > this.data.highScores.bestWave) {
      this.data.highScores.bestWave = wave;
      changed = true;
    }
    if (score > this.data.highScores.bestScore) {
      this.data.highScores.bestScore = score;
      changed = true;
    }
    if (time > this.data.highScores.bestTime) {
      this.data.highScores.bestTime = time;
      changed = true;
    }
    if (changed) this.save();
  }

  setLastCharacter(id) {
    this.data.lastCharacter = id;
    this.save();
  }

  getLastCharacter() {
    return this.data.lastCharacter || 'tim_alberino';
  }

  incrementRuns() {
    this.data.totalRuns += 1;
    this.save();
  }

  // Export / Import for backup
  exportSave() {
    return btoa(JSON.stringify(this.data));
  }

  importSave(base64String) {
    try {
      const parsed = JSON.parse(atob(base64String));
      if (parsed && parsed.version) {
        this.data = { ...this.getDefaultSave(), ...parsed };
        this.save();
        return true;
      }
    } catch (e) {
      console.warn('Invalid save import', e);
    }
    return false;
  }

  resetProgress() {
    this.data = this.getDefaultSave();
    this.save();
  }
}

// Singleton
const progressionManager = new ProgressionManager();
export default progressionManager;
