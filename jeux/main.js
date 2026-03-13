const menuData = {
    "les last versions direct":
        {
            "All_IN_ONE_CASINO":"casino/all_in_one/v2.html",
            "Roulette a 2":"casino/roulette/roulette.html",
            "chess a 2": "chess/chess.html",
            "Combat a 2": "combat_2_joueur/fonctionnel/testtt.html",
            "cookie_clicker ": "cookie/cokkie_clicker.html",
            "geometry dash": "geometry_dash/geometry_dash.html",
            "shooter": "shooter/fonctionnel/parfait/test_4.html",
            "snake": "snake/snake.html",

        },

    "casino": {
        "all_in_one": {
            "v1.html": "casino/all_in_one/v1.html",
            "v2.html": "casino/all_in_one/v2.html"
        },
        "roulette": {
            "roulette.html": "casino/roulette/roulette.html",
            "roulette_claude.html": "casino/roulette/roulette_claude.html"
        }
    },
    "chess": {
        "chess a 2": "chess/chess.html",
        "chess a 2 v2": "chess/chess_v3.html"
    },
    "combat_2_joueur": {
        "a_debug": {
            "jeu-combat (1).html": "combat_2_joueur/a_debug/jeu-combat (1).html",
            "jeu-combat (2).html": "combat_2_joueur/a_debug/jeu-combat (2).html",
            "jeu_chat_claude.html": "combat_2_joueur/a_debug/jeu_chat_claude.html"
        },
        "fonctionnel": {
            "testtt.html": "combat_2_joueur/fonctionnel/testtt.html"
        }
    },
    "cookie": {
        "cokkie_clicker.html": "cookie/cokkie_clicker.html"
    },
    "farmer": {
        "a_debug": {
            "test_3.html": "farmer/a_debug/test_3.html",
            "test_4.html": "farmer/a_debug/test_4.html"
        },
        "fonctionnel": {
            "test_2.html": "farmer/fonctionnel/test_2.html"
        }
    },
    "geometry_dash": {
        "geometry_dash.html": "geometry_dash/geometry_dash.html"
    },
    "pacman": {
        "pacman.html": "pacman/pacman.html"
    },
    "shooter": {
        "a_debug": {
            "test_4.html": "shooter/a_debug/test_4.html"
        },
        "fonctionnel": {
            "modifiable": {
                "test_3.html": "shooter/fonctionnel/modifiable/test_3.html"
            },
            "parfait": {
                "test_1.html": "shooter/fonctionnel/parfait/test_1.html",
                "test_2.html": "shooter/fonctionnel/parfait/test_2.html",
                "test_4.html": "shooter/fonctionnel/parfait/test_4.html",
                "test_5.html": "shooter/fonctionnel/parfait/test_5.html"
            }
        },
        "simulation": {
            "jeux_chat.html": "shooter/simulation/jeux_chat.html"
        }
    },
    "snake": {
        "snake.html": "snake/snake.html",
    }
};

const listContainer = document.getElementById("list-container");
const backBtn = document.getElementById("back-btn");

let currentPath = [];

function renderList(data) {
    listContainer.innerHTML = "";
    const ul = document.createElement("ul");

    for (const key in data) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "item-btn";
        btn.textContent = key;

        if (typeof data[key] === "string") {
            btn.onclick = () => window.open(data[key], "_blank");
        } else {
            btn.onclick = () => {
                currentPath.push(key);
                updateView();
            };
        }

        li.appendChild(btn);
        ul.appendChild(li);
    }
    listContainer.appendChild(ul);
}

function getDataAtPath(path) {
    let current = menuData;
    for (const p of path) {
        current = current[p];
    }
    return current;
}

function updateView() {
    if (currentPath.length === 0) {
        backBtn.style.display = "none";
    } else {
        backBtn.style.display = "block";
    }
    const data = getDataAtPath(currentPath);
    renderList(data);
}

backBtn.onclick = () => {
    currentPath.pop();
    updateView();
};

updateView();