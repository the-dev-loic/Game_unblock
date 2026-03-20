const menuData = {
    "les last versions direct":
        {
            "Aim trainer":"Jouable/aim_trainer/aim_trainer_3/aim_trainer_3.html",

            "All_IN_ONE_CASINO":"Jouable/casino/all_in_one/All_in_one_1.html",

            "Roulette a 2":"Jouable/casino/roulette/roulette_1/roulette_1.html",

            "chess a 2": "Jouable/chess/chess_1/chess_1.html",

            "Combat a 2": "Jouable/combat_2_joueur/fonctionnel/C-2-j.html",

            "cookie_clicker ": "Jouable/cookie/cookie_clicker_1/cookie_clicker_1.html",

            "geometry dash": "Jouable/geometry_dash/geometry_dash_1/geometry_dash_1.html",

            "shooter": "Jouable/shooter/shooter_5/shooter_5.html",

            "snake": "Jouable/snake/snake_1/snake_1.html",

            "Tetris" :"Jouable/tetris/tetris_2/tetris_2.html"

        },
    "aim Trainer":{
        "Aim trainer apex ":"Jouable/aim_trainer/aim_trainer_3/aim_trainer_3.html",
        "Aim trainer base ":"Jouable/aim trainer/aim_trainer_1/aim_trainer_1.html",
        "Aim trainer v4":"Jouable/aim_trainer/aim_trainer_4/aim_trainer_4.html"
    },

    "Tetris":{
        "tetris 1 ":"Jouable/tetris/tetris_2/tetris_2.html",
        "tetris_2": "Jouable/tetris/tetris_1/tetris_1.html"
    },

    "casino": {

        "all_in_one": {
            "All in one ": "Jouable/casino/all_in_one/All_in_one_1.html"
        },

        "roulette": {
            "roulette 1": "Jouable/casino/roulette/roulette_1/roulette_1.html",
            "roulette 2 ": "Jouable/casino/roulette/roulette_2/roulette_2.html"
        }
    },
    "chess": {
        "chess a 2": "Jouable/chess/chess_1/chess_1.html",
        "chess a 2 ": "Jouable/chess/chess_2/chess_2.html"
    },
    "combat_2_joueur": {
            "Combat a 2": "Jouable/combat_2_joueur/C-2-j/C-2-j.html"

    },
    "cookie clicker": {
        "cookie_clicker": "Jouable/cookie_clicker/cookie_clicker_1/cookie_clicker_1.html"
    },
    "geometry_dash": {
        "geometry_dash": "geometry_dash/geometry_dash_1/geometry_dash_1.html"
    },

    "shooter": {
            "parfait": {
                "Shooter 1 ": "Jouable/shooter/Shooter_1/shooter_1.html",
                "Shooter 2 ": "Jouable/shooter/Shooter_2/shooter_2.html",
                "Shooter 3 ": "Jouable/shooter/Shooter_3/shooter_3.html",
                "Shooter 5": "Jouable/shooter/Shooter_5/shooter_5.html"
            },

        "simulation": {
            "jeux_chat.html": "shooter/simulation/jeux_chat.html"
        }
    },
    "snake": {
        "snake.html": "Jouable/snake/snake_1/snake_1.html",
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