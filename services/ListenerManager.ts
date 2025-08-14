// Generic listener manager to reduce code duplication
export class ListenerManager<T> {
    private listeners: Array<(data: T) => void> = [];

    add(callback: (data: T) => void): () => void {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    notify(data: T): void {
        this.listeners.forEach(listener => {
            try { listener(data); } catch (e) { /* ignore */ }
        });
    }

    clear(): void {
        this.listeners.length = 0;
    }

    get count(): number {
        return this.listeners.length;
    }
} 