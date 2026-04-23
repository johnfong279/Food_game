import { Petal } from "../entities/Petal";
import { Snack } from "../entities/Snack";

export class Spawner {
  private nextPetalIn: number;
  private nextSnackIn: number;
  private idCounter: number;

  constructor() {
    this.nextPetalIn = this.randomPetalInterval();
    this.nextSnackIn = this.randomSnackInterval();
    this.idCounter = 0;
  }

  private randomPetalInterval() {
    return 200 + Math.random() * 200;
  }

  private randomSnackInterval() {
    return 3000 + Math.random() * 2000;
  }

  update(dt: number, canvasWidth: number): { petals: Petal[]; snacks: Snack[] } {
    const elapsed = dt * 1000;
    const newPetals: Petal[] = [];
    const newSnacks: Snack[] = [];

    this.nextPetalIn -= elapsed;
    if (this.nextPetalIn <= 0) {
      newPetals.push(new Petal(this.idCounter++, canvasWidth));
      this.nextPetalIn = this.randomPetalInterval();
    }

    this.nextSnackIn -= elapsed;
    if (this.nextSnackIn <= 0) {
      newSnacks.push(new Snack(this.idCounter++, canvasWidth));
      this.nextSnackIn = this.randomSnackInterval();
    }

    return { petals: newPetals, snacks: newSnacks };
  }

  reset() {
    this.nextPetalIn = this.randomPetalInterval();
    this.nextSnackIn = this.randomSnackInterval();
    this.idCounter = 0;
  }
}
