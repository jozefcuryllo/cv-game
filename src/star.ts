class MyStar {
    dx: number;
    label: string;

    constructor(label: string, dx: number = 200) {
        this.dx = dx;
        this.label = label;
    }
};

let predefinedStars = [
    new MyStar("Basics of DOS", 800),
    new MyStar("Basics of Pascal"),
    new MyStar("Basics of Assembler - 13h"),
    new MyStar("Basics of electronics"),
    // ---
    new MyStar("Basics of C++", 800),
    new MyStar("Basics of algorithms"),
    new MyStar("Basics of networks"),
    new MyStar("HTML & CSS"),
    new MyStar("Basics of PHP"),
    // ---
    new MyStar("Data structures and algorithms", 800),
    new MyStar("C"),
    new MyStar("C++"),
    new MyStar("C#"),
    new MyStar("Java"),
    new MyStar("Embedded programming"),
    new MyStar("English C1"),
    new MyStar("Android"),
    new MyStar("PHP"),
    new MyStar("Basics of AI"),
    new MyStar("Linux"),
    new MyStar("Databases"),
    // ---
    new MyStar("Advanced PHP", 500),
    new MyStar("Advanced JavaScript",),
    new MyStar("Docker"),
    new MyStar("NodeJS"),
    new MyStar("MongoDB"),
    new MyStar("Spanish A2+"),
    // ---
    new MyStar("Advanced UML & OCL", 500),
    new MyStar("AI"),
    new MyStar("Parallel computing"),
    new MyStar("Testing"),
    new MyStar("Language processing"),
    // ---
    new MyStar("Advanced PHP", 1000),
    new MyStar("Advanced MySQL"),
    new MyStar("Big Data"),
    new MyStar("Advanced Linux"),
    new MyStar("Python"),
    new MyStar("Queues"),
    // ---
    new MyStar("Advanced PHP"),
    new MyStar("Advanced SQL"),
    new MyStar("Advanced Python"),
    new MyStar("Advanced Docker"),
];

export {predefinedStars, MyStar};