
const pokeApi = {}

async function convertPokeApiDetailToPokemon(pokeDetail) {
    const pokemon = new Pokemon();

    pokemon.number = pokeDetail.id;
    pokemon.name = pokeDetail.name;

    // Types
    const types = pokeDetail.types.map((t) => t.type.name);
    pokemon.types = types;
    pokemon.type = types[0];

    // Sprite
    pokemon.photo =
        pokeDetail.sprites.other.dream_world.front_default ||
        pokeDetail.sprites.other["official-artwork"].front_default;

    // Height / Weight
    pokemon.height = pokeDetail.height;
    pokemon.weight = pokeDetail.weight;

    // Abilities
    pokemon.abilities = pokeDetail.abilities.map((a) => a.ability.name);

    // Stats
    pokemon.stats = pokeDetail.stats.map((s) => ({
        name: s.stat.name,
        value: s.base_stat,
    }));

    // Moves
    pokemon.moves = pokeDetail.moves.map((m) => m.move.name);

    // ===========================
    // EXTRA DATA REQUIRES OTHER ENDPOINTS
    // ===========================

    // Species data
    const speciesResponse = await fetch(pokeDetail.species.url);
    const species = await speciesResponse.json();

    // Species
    pokemon.species = species.genera.find((g) => g.language.name === "en").genus;

    // Gender Rate (0–8 -> 0% a 100%)
    const femaleRate = species.gender_rate;
    pokemon.gender = {
        female: femaleRate === -1 ? 0 : (femaleRate / 8) * 100,
        male: femaleRate === -1 ? 0 : 100 - (femaleRate / 8) * 100,
    };

    // Egg Groups
    pokemon.eggGroups = species.egg_groups.map((g) => g.name);

    // Egg Cycle
    pokemon.eggCycle = species.hatch_counter;

    // ===========================
    // EVOLUTION CHAIN
    // ===========================
    const evoUrl = species.evolution_chain.url;
    const evoResponse = await fetch(evoUrl);
    const evoChain = await evoResponse.json();

    pokemon.evolution = await convertEvolutionChain(evoChain.chain);

    return pokemon;
}

async function convertEvolutionChain(chain) {
    const evoList = [];

    async function getPokemonData(name) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        const data = await res.json();
        return {
            name: data.name,
            img:
                data.sprites.other["official-artwork"].front_default ||
                data.sprites.front_default,
        };
    }

    let current = chain;

    while (current) {
        const evoData = await getPokemonData(current.species.name);
        evoList.push(evoData);

        current = current.evolves_to[0];
    }

    return evoList;
}

pokeApi.getPokemonDetail = async (pokemon) => {
    let apiurl;

    if (typeof pokemon === 'number' || typeof pokemon === 'string') {
        apiurl = `https://pokeapi.co/api/v2/pokemon/${pokemon}/`;
    } else {
        apiurl = pokemon.url;
    }

    const response = await fetch(apiurl);
    const json = await response.json();
    return await convertPokeApiDetailToPokemon(json);
};

pokeApi.getPokemons = (offset = 0, limit = 5) => {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`

    return fetch(url)
        .then((response) => response.json())
        .then((jsonBody) => jsonBody.results)
        .then((pokemons) => pokemons.map((pokeApi.getPokemonDetail)))
        .then((detailRequests) => Promise.all(detailRequests))
        .then((pokemonsDetails) => pokemonsDetails)
}
