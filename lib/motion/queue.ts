/**
 * AnimationQueue — a serial, re-usable async work queue.
 *
 * The rider sequence is a state machine that must never overlap itself, no
 * matter how fast a shopper taps "Add to cart". Every interaction becomes a
 * job; jobs run strictly one at a time. Overflow jobs are flushed immediately
 * so a cart write can never be silently dropped.
 */
export class AnimationQueue<T> {
  private items: T[] = [];
  private running = false;
  private disposed = false;

  constructor(
    private readonly handler: (item: T) => Promise<void>,
    private readonly options: { max?: number; onOverflow?: (item: T) => void } = {},
  ) {}

  enqueue(item: T): void {
    if (this.disposed) {
      this.options.onOverflow?.(item);
      return;
    }
    const max = this.options.max ?? 30;
    if (this.items.length >= max) {
      const dropped = this.items.shift();
      if (dropped !== undefined) this.options.onOverflow?.(dropped);
    }
    this.items.push(item);
    void this.pump();
  }

  private async pump(): Promise<void> {
    if (this.running || this.disposed) return;
    this.running = true;
    while (this.items.length > 0 && !this.disposed) {
      const item = this.items.shift() as T;
      try {
        await this.handler(item);
      } catch {
        // Keep the queue alive — one failed job must not stall the rest.
      }
    }
    this.running = false;
  }

  get size(): number {
    return this.items.length;
  }

  get busy(): boolean {
    return this.running;
  }

  /** Drain remaining jobs through `flush` (used to guarantee cart writes). */
  clear(flush?: (item: T) => void): void {
    if (flush) {
      for (const item of this.items) flush(item);
    }
    this.items = [];
  }

  dispose(flush?: (item: T) => void): void {
    this.clear(flush);
    this.disposed = true;
  }
}
