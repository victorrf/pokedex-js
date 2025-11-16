
class Pokemon {
    number;
    name;
    type;
    types = [];
    photo;

    // About
    species;
    height;
    weight;
    abilities = [];

    // Breeding
    gender = { male: 0, female: 0 };
    eggGroups = [];
    eggCycle;

    // Base stats
    stats = [];

    // Evolution
    evolution = [];

    // Moves
    moves = [];
}