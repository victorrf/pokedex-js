const typeColors = {
  normal: "#a6a877", fire: "#ee7f30", water: "#678fee", electric: "#f7cf2e",
  grass: "#77c850", ice: "#98d5d7", fighting: "#bf3029", poison: "#a040a0",
  ground: "#dfbf69", flying: "#a98ff0", psychic: "#f65687", bug: "#a8b720",
  rock: "#b8a137", ghost: "#6e5896", dragon: "#6f38f6", dark: "#725847",
  steel: "#b9b7cf", fairy: "#f9aec7"
};

function getId(){
  return new URLSearchParams(location.search).get("id");
}

async function api(url){
  const r = await fetch(url);
  return await r.json();
}

function cap(s){ 
  return s ? s[0].toUpperCase() + s.slice(1) : s; 
}



/* ---------------------------EVOLUTION CHAIN---------------------------- */
async function getEvolutionChain(speciesUrl) {
    const species = await api(speciesUrl);
    const chainData = await api(species.evolution_chain.url);

    const evolution = [];
    let chain = chainData.chain;

    while (chain) {
        evolution.push(chain.species);
        chain = chain.evolves_to.length ? chain.evolves_to[0] : null;
    }

    // Buscar artes oficiais
    return Promise.all(
        evolution.map(async (s) => {
            const p = await api(`https://pokeapi.co/api/v2/pokemon/${s.name}`);
            return {
                id: p.id,
                name: p.name,
                img: p.sprites.other["official-artwork"].front_default,
            };
        })
    );
}

function renderEvolution(chain) {
    const box = document.getElementById("evolution-chain");
    box.innerHTML = "";

    if (!chain || chain.length === 0) {
        box.textContent = "No evolution data available.";
        return;
    }

    chain.forEach((stage, i) => {
        const card = document.createElement("div");
        card.className = "evo-card";

        card.innerHTML = `
            <a href="detail.html?id=${stage.id}" class="pokemon-link">
                <img src="${stage.img}" alt="${stage.name}">
                <div class="evo-name">${cap(stage.name)}</div>
                <div class="evo-id">#${String(stage.id).padStart(3, "0")}</div>
            </a>
        `;

        box.appendChild(card);

        if (i < chain.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "arrow";
            arrow.textContent = "→";
            box.appendChild(arrow);
        }
    });
}



/* ---------------------------BASE STATS---------------------------- */
function renderBaseStats(stats, primaryType){
  const container = document.getElementById("stats-container");
  container.innerHTML = "";

  const order = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  let total = 0;

  order.forEach(statName => {
    const stat = stats.find(s => s.stat.name === statName);
    const value = stat.base_stat;
    total += value;

    const item = document.createElement("div");
    item.className = "stat-item";

    item.innerHTML = `
      <div class="stat-name">${formatStat(statName)}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-bar">
        <span class="stat-fill" 
              style="width:${value/255*100}%; 
                     background:${typeColors[primaryType]}"></span>
      </div>
    `;

    container.appendChild(item);
  });

    document.getElementById("total-stats").textContent = total;

    const totalPercent = Math.min(total / 720, 1) * 100;

    document.querySelector(".total-fill").style.width = totalPercent + "%";
    document.querySelector(".total-fill").style.background = typeColors[primaryType];
    
}

function formatStat(s){
  return s
    .replace("special-attack", "Sp. Atk")
    .replace("special-defense", "Sp. Def")
    .replace("attack", "Attack")
    .replace("defense", "Defense")
    .replace("hp", "HP")
    .replace("speed", "Speed");
}



/* ---------------------------RENDER TYPES---------------------------- */
function renderTypes(poke) {
    const typesDiv = document.getElementById("pokemon-types");
    typesDiv.innerHTML = "";

    poke.types.forEach(t => {
        const type = t.type.name;

        const pill = document.createElement("span");
        pill.classList.add("type-pill");
        pill.setAttribute("data-type", type);
        pill.textContent = cap(type);
        pill.style.background = typeColors[type];

        typesDiv.appendChild(pill);
    });
}



/* ---------------------------ABOUT---------------------------- */
function renderAbout(poke, species){
  document.getElementById("species").textContent =
    species.genera.find(g => g.language.name === "en")?.genus || "-";

  document.title = cap(poke.name);

  document.getElementById("height").textContent = (poke.height / 10).toFixed(2) + " m";
  document.getElementById("weight").textContent = (poke.weight / 10).toFixed(1) + " kg";
  document.getElementById("abilities").textContent =
    poke.abilities.map(a => a.ability.name).join(", ");

  const rate = species.gender_rate;
  if(rate === -1){
    document.getElementById("gender").textContent = "Genderless";
  } else {
    const female = (rate / 8) * 100;
    const male = 100 - female;
    document.getElementById("gender").textContent =
      `♂ ${male.toFixed(1)}%   ♀ ${female.toFixed(1)}%`;
  }

  document.getElementById("egg-groups").textContent =
    species.egg_groups.map(g => g.name).join(", ");

  document.getElementById("egg-cycle").textContent =
    species.hatch_counter + " cycles";
}



/* ---------------------------MOVES---------------------------- */
function renderMoves(moves) {
    const ul = document.getElementById("moves-list");
    ul.innerHTML = "";

    if (!moves || moves.length === 0) {
        ul.innerHTML = "<li>No moves found.</li>";
        return;
    }

    moves.forEach((m) => {
        const li = document.createElement("li");
        li.textContent = m.move.name;
        ul.appendChild(li);
    });
}




/* ---------------------------TABS---------------------------- */
function setupTabs(){
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    };
  });
}



/* ---------------------------MAIN INIT---------------------------- */
(async function init(){
  setupTabs();

  const id = getId();
  if(!id){
    alert("Passe ?id=NUMERO na URL");
    return;
  }

  const poke = await api(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const species = await api(poke.species.url);
  const evolution = await getEvolutionChain(poke.species.url);

  const primaryType = poke.types[0].type.name;

  // header
  document.getElementById("pokemon-name").textContent = cap(poke.name);
  document.getElementById("pokemon-number").textContent = "#" + String(poke.id).padStart(3,"0");
  document.getElementById("pokemon-img").src =
    poke.sprites.other["official-artwork"].front_default;

  // render types
  renderTypes(poke);

  // header color
  document.querySelector(".pokemon-header").style.background =
    typeColors[primaryType];

  // sections
  renderAbout(poke, species);
  renderBaseStats(poke.stats, primaryType);
  renderEvolution(evolution);
  renderMoves(poke.moves);
})();
