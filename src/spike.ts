class MySpike {
    dx: number;
    label: string;

    constructor(label: string, dx: number = 500) {
        this.dx = dx;
        this.label = label;
    }
};

let predefinedspikes = [
    new MySpike("Hard exams", 3500),
    new MySpike("Theory overload", 1000),
    new MySpike("Maths", 1000),
    // ---
    new MySpike("Complex Logic", 3500),
    new MySpike("New Stack", 2000),
    new MySpike("Eye Strain", 1000),
    new MySpike("Big Refactor"),
    new MySpike("Brain Fog"),
    new MySpike("Late Hours"),
    new MySpike("Legacy Debt"),
    new MySpike("Deep Focus"),
    new MySpike("Edge Cases"),
    new MySpike("Mental Load"),
    new MySpike("System Migration"),
    new MySpike("Energy Drain"),
    new MySpike("Fixing Production"),
    new MySpike("Burnout Risk"),
    new MySpike("Strict Deadlines"),
    new MySpike("Sleepy Coder"),
    new MySpike("High Traffic"),
    new MySpike("No Strength"),
    new MySpike("API Bottlenecks"),
    new MySpike("Creative Block"),
    new MySpike("Security Patching"),
    new MySpike("Pure Exhaustion"),
    new MySpike("Code Review Loop"),
    new MySpike("Heavy Pressure"),
    new MySpike("Hard Debugging"),
    new MySpike("Out of Power"),
    new MySpike("Scalability Peak"),
    new MySpike("Total Fatigue"),
    new MySpike("Critical Update"),
    new MySpike("Need a Break")
];

export { predefinedspikes, MySpike };