export class Sparkline {
  private values: number[] = [];
  private maxLen = 60;

  push(val: number): void {
    this.values.push(val);
    if (this.values.length > this.maxLen) this.values.shift();
  }

  getValues(): number[] { return [...this.values]; }
}
