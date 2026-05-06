import { Petal } from "../entities/Petal";
import { Snack } from "../entities/Snack";

const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;
const FINAL_REWARD_WINDOW_PROGRESS = 25 / 35;
const FINAL_REWARD_INTERVAL_MULTIPLIER = 0.5;

export class Spawner {
  private nextPetalIn: number;
  private nextSnackIn: number;
  private idCounter: number;

  constructor() {
    this.nextPetalIn = this.randomPetalInterval();
    this.nextSnackIn = this.randomSnackInterval();
    this.idCounter = 0;
  }

  private randomPetalInterval(progress = 0) {
    const min = lerp(200, 140, progress);
    const range = lerp(200, 120, progress);
    return min + Math.random() * range;
  }

  private randomSnackInterval(progress = 0) {
    const endWeightedProgress = progress * progress;
    const min = lerp(2600, 850, endWeightedProgress);
    const range = lerp(900, 500, endWeightedProgress);
    const interval = min + Math.random() * range;
    return progress >= FINAL_REWARD_WINDOW_PROGRESS
      ? interval * FINAL_REWARD_INTERVAL_MULTIPLIER
      : interval;
  }

  update(dt: number, canvasWidth: number, progress = 0): { petals: Petal[]; snacks: Snack[] } {
    const elapsed = dt * 1000;
    const newPetals: Petal[] = [];
    const newSnacks: Snack[] = [];

    this.nextPetalIn -= elapsed;
    if (this.nextPetalIn <= 0) {
      newPetals.push(new Petal(this.idCounter++, canvasWidth));
      this.nextPetalIn = this.randomPetalInterval(progress);
    }

    this.nextSnackIn -= elapsed;
    if (this.nextSnackIn <= 0) {
      newSnacks.push(new Snack(this.idCounter++, canvasWidth));
      this.nextSnackIn = this.randomSnackInterval(progress);
    }

    return { petals: newPetals, snacks: newSnacks };
  }

  reset() {
    this.nextPetalIn = this.randomPetalInterval();
    this.nextSnackIn = this.randomSnackInterval();
    this.idCounter = 0;
  }
}
