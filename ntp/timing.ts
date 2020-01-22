class Timing {
    public static systemPrecision(): number {
        return systemPrecision;
    }

    public static measurePrecision(numIterations: number = 8): number {
        let measurements: Array<number> = [];
        for (let i = 0; i < numIterations; i++) {
            measurements.push(this.singlePrecisionMeasurement());
        }
        return Math.min(...measurements.map(Math.abs));
    }

    private static singlePrecisionMeasurement(): number {
        let t;
        const start = t = this.getTimeMillis();
        do {
            t = this.getTimeMillis();
        } while (start == t);

        return t - start;
    }

    public static getTimeMillis(): number {
        return Date.now();
    }
}

let systemPrecision: number = Timing.measurePrecision();

export default Timing;
