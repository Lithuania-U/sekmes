const width = 600;
const height = 600;
const radius = 250; // Išorinis diagramos spindulys
const innerRadius = 80; // Vidinio rato spindulys (kategorijų etiketėms ir centriniam tekstui)

// Kategorijų spalvos
const categoryColors = {
    "Matematinis, loginis protas": "#3498db", // Mėlyna
    "Organizacinis, valdžia": "#f39c12",       // Geltona ochra
    "Fizinis, genai, jėga": "#2ecc71",         // Salotinė
    "Jausmai, emocijos": "#e74c3c"            // Raudona
};

// Vartotojo įgūdžių reitingai (inicializuojami)
let userSkillRatings = {}; // Objekto formatas: { skillTitle: level, ... }

d3.json("data.json").then(data => {
    // Inicializuojame vartotojo įgūdžių reitingus su numatytąja verte (0)
    data.forEach(d => {
        userSkillRatings[d.title] = 0; // Pradinė reikšmė 0, kad diagrama atsirastų tik kai bus įvertinta
    });

    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", `-50 -50 ${width + 100} ${height + 100}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const tooltip = d3.select("#tooltip");

    // Neryškus apskritimas su laipsniais (kas 30 laipsnių)
    for (let i = 0; i < 360; i += 30) {
        const angleRad = (i - 90) * Math.PI / 180; // Kampo skaičiavimas liko originalus
        g.append("line")
            .attr("x1", Math.cos(angleRad) * innerRadius)
            .attr("y1", Math.sin(angleRad) * innerRadius)
            .attr("x2", Math.cos(angleRad) * radius)
            .attr("y2", Math.sin(angleRad) * radius)
            .attr("stroke", "#d0d0d0")
            .attr("stroke-width", 0.7)
            .attr("class", "bg-line"); // Pridėta klasė, kad būtų lengviau pasiekti per paiešką

        g.append("text")
            .attr("x", Math.cos(angleRad) * (radius + 15))
            .attr("y", Math.sin(angleRad) * (radius + 15))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "10px")
            .attr("fill", "#808080")
            .text(`${i}°`)
            .attr("class", "bg-text"); // Pridėta klasė
    }

    // Neryškūs apskritimai sudėtingumo vertėms (2, 4, 6, 8, 10)
    const levelRadii = [2, 4, 6, 8, 10];
    levelRadii.forEach(level => {
        const currentRadius = level * 20 + innerRadius;
        g.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", currentRadius)
            .attr("fill", "none")
            .attr("stroke", "#d0d0d0")
            .attr("stroke-width", 0.7)
            .attr("class", "bg-circle"); // Pridėta klasė
    });

    // Stiprumo vektorių etiketės nupieštos ant 85 ir 185 laipsnių
    const labelAngles = [85, 185];
    const labelOffset = 15;

    levelRadii.forEach(level => {
        labelAngles.forEach(angle => {
            const angleRad = (angle - 90) * Math.PI / 180; // Kampo skaičiavimas liko originalus
            const x = Math.cos(angleRad) * (level * 20 + innerRadius + labelOffset);
            const y = Math.sin(angleRad) * (level * 20 + innerRadius + labelOffset);

            g.append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", "10px")
                .attr("fill", "#a0a0a0")
                .text(level)
                .attr("class", "bg-text"); // Pridėta klasė
        });
    });

    // Grupuojame linijas ir apskritimus kartu, kad būtų lengviau filtruoti
    const skillElements = g.selectAll(".skill-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "skill-group")
        .attr("transform", d => {
            const angleRad = (d.angle - 90) * Math.PI / 180; // Kampo skaičiavimas liko originalus
            const x = Math.cos(angleRad) * (d.level * 20 + innerRadius);
            const y = Math.sin(angleRad) * (d.level * 20 + innerRadius);
            return `translate(${x},${y})`;
        });

    skillElements.append("line")
        .attr("x1", d => Math.cos((d.angle - 90) * Math.PI / 180) * innerRadius - Math.cos((d.angle - 90) * Math.PI / 180) * (d.level * 20 + innerRadius))
        .attr("y1", d => Math.sin((d.angle - 90) * Math.PI / 180) * innerRadius - Math.sin((d.angle - 90) * Math.PI / 180) * (d.level * 20 + innerRadius))
        .attr("x2", 0)
        .attr("y2", 0)
        .attr("stroke", d => categoryColors[d.category] || "#cccccc") // Spalva pagal kategoriją liko originali
        .attr("stroke-width", 1.5)
        .attr("class", "skill-line");

    skillElements.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 8)
        .attr("fill", d => categoryColors[d.category] || "#cccccc") // Spalva pagal kategoriją liko originali
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("class", "cursor-pointer skill-circle")
        .on("click", (event, d) => showInfo(d))
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).transition().duration(100).attr("r", 10);
            tooltip.html(`<strong>${d.title}</strong><br>Laipsnis: ${d.angle}°<br>Sudėtingumas: ${d.level}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .style("opacity", 1);
        })
        .on("mouseout", (event, d) => {
            d3.select(event.currentTarget).transition().duration(100).attr("r", 8);
            tooltip.style("opacity", 0);
        })
        .on("touchstart", (event, d) => {
            event.preventDefault();
            d3.select(event.currentTarget).transition().duration(100).attr("r", 10);
            tooltip.html(`<strong>${d.title}</strong><br>Laipsnis: ${d.angle}°<br>Sudėtingumas: ${d.level}`)
                .style("left", (event.touches[0].pageX + 10) + "px")
                .style("top", (event.touches[0].pageY - 20) + "px")
                .style("opacity", 1);
        })
        .on("touchend", (event, d) => {
            d3.select(event.currentTarget).transition().duration(100).attr("r", 8);
            tooltip.style("opacity", 0);
        });

    // Centriniai spalvoti užrašai
    const centralTextData = [
        { text: "Hard", color: "#2ecc71", dy: -35, fontSize: "22px" },
        { text: "Skills", color: "#f39c12", dy: -10, fontSize: "22px" },
        { text: "Radialinė", color: "#3498db", dy: 15, fontSize: "22px" },
        { text: "Diagrama", color: "#e74c3c", dy: 40, fontSize: "22px" }
    ];

    centralTextData.forEach(item => {
        g.append("text")
            .attr("x", 0)
            .attr("y", item.dy)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", item.fontSize)
            .attr("font-weight", "bold")
            .attr("fill", item.color)
            .text(item.text)
            .attr("class", "central-text"); // Pridėta klasė
    });

    // Funkcija, kuri parodys kategorijas stulpelyje info-panel dalyje
    function displayCategoriesColumn() {
        const categoriesView = d3.select("#categoriesView");
        categoriesView.html(""); // Išvalome esamą turinį

        const categoryAngleRanges = {
            "Matematinis, loginis protas": "315°- 45°",
            "Organizacinis, valdžia": "45°- 135°",
            "Fizinis, genai, jėga": "135°-225°",
            "Jausmai, emocijos": "225°-315°"
        };

        const categories = d3.groups(data, d => d.category);
        
        let categoriesHtml = `
            <h2 class="text-xl font-bold mb-4 text-gray-900">4 Vėjai ir 36 kryptys</h2> <!-- Antraštė pakeista -->
            <div class="space-y-2">
        `;

        categories.forEach(category => {
            const categoryName = category[0];
            const color = categoryColors[categoryName] || '#666';
            const angleRange = categoryAngleRanges[categoryName] || 'N/A';

            categoriesHtml += `
                <div class="flex items-center gap-2">
                    <span style="background-color: ${color};" class="block w-4 h-4 rounded-full"></span>
                    <p class="text-gray-700 font-semibold">${categoryName} (${angleRange})</p>
                </div>
            `;
        });

        categoriesHtml += `</div><div class="mt-6 text-gray-600">Pasirink sritį grafike, kad pamatytum detales.</div>`;
        categoriesView.html(categoriesHtml);

        d3.selectAll(".category-button").on("click", null); // Atsiejame klausytojus
    }

    // Funkcija, kuri generuoja ĮGŪDŽIŲ RADIO MYGTUKUS
    function renderSkillRadioButtons() {
        const skillsRadioButtonsDiv = d3.select("#skillsRadioButtons");
        skillsRadioButtonsDiv.html(""); // Išvalome esamus mygtukus

        data.forEach(d => {
            const skillDiv = skillsRadioButtonsDiv.append("div")
                .attr("class", "flex flex-col gap-1 mb-4 border-b pb-2"); // Pridėta vizualinio atskyrimo

            skillDiv.append("label")
                .attr("class", "text-sm font-medium text-gray-700 mb-1")
                .text(d.title);

            const radioGroupName = `skill-${d.title.replace(/\s/g, '-')}`;
            const maxLevel = d.level; // Gauti maksimalų sudėtingumo lygį iš data.json

            const radioButtonsContainer = skillDiv.append("div")
                .attr("class", "flex flex-wrap gap-2 mt-1"); // Naudojame flex wrap, kad mygtukai tilptų

            // Pradedame nuo 0
            for (let i = 0; i <= maxLevel; i++) {
                const radioId = `${radioGroupName}-${i}`;
                const radioContainer = radioButtonsContainer.append("div")
                    .attr("class", "flex items-center");

                radioContainer.append("input")
                    .attr("type", "radio")
                    .attr("id", radioId)
                    .attr("name", radioGroupName)
                    .attr("value", i)
                    .attr("class", "form-radio h-4 w-4 text-gray-400 border-gray-300 focus:ring-gray-300 cursor-pointer") // Šviesiai pilka spalva
                    .property("checked", userSkillRatings[d.title] === i) // Pažymime esamą reikšmę
                    .on("change", function() {
                        const value = +this.value;
                        userSkillRatings[d.title] = value;
                        updatePersonalDiagram(); // Atnaujiname asmeninę diagramą
                    });

                radioContainer.append("label")
                    .attr("for", radioId)
                    .attr("class", `ml-1 text-sm ${i === 0 ? 'text-gray-500' : 'text-gray-700'}`) // Pilkesnė spalva nuliui
                    .text(i);
            }
        });

        // Pridedame eksportavimo mygtukus
        const exportButtonsContainer = skillsRadioButtonsDiv.append("div")
            .attr("class", "mt-6 pt-4 border-t border-gray-200 flex flex-col gap-2"); // Separatorius ir tarpai

        exportButtonsContainer.append("button")
            .attr("id", "exportJsonBtn")
            .attr("class", "px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors")
            .text("Eksportuoti į JSON")
            .on("click", () => exportToJson(userSkillRatings));

        exportButtonsContainer.append("button")
            .attr("id", "exportCsvBtn")
            .attr("class", "px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors")
            .text("Eksportuoti į CSV")
            .on("click", () => exportToCsv(data, userSkillRatings)); // Perduodami visi duomenys

        exportButtonsContainer.append("button")
            .attr("id", "exportHtmlBtn")
            .attr("class", "px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors")
            .text("Eksportuoti į HTML")
            .on("click", () => exportToHtml(data, userSkillRatings)); // Perduodami visi duomenys
    }

    // Funkcija, kuri atnaujina arba nupiešia asmeninę diagramą
    function updatePersonalDiagram() {
        // Pašaliname esamą asmeninę diagramą, jei ji egzistuoja
        g.select(".personal-diagram-path").remove();

        // Filtruojame įgūdžius, kurių lygis yra didesnis nei 0
        const ratedSkills = data.filter(d => userSkillRatings[d.title] > 0);

        if (ratedSkills.length === 0) {
            return; // Jei nėra įvertintų įgūdžių, nieko nepiešiame
        }

        // Surūšiuojame įgūdžius pagal kampą, kad sujungimo linija būtų tvarkinga
        ratedSkills.sort((a, b) => a.angle - b.angle);

        // Sukuriame linijos generatorių
        const lineGenerator = d3.lineRadial()
            .angle(d => {
                // Grįžtame į 90 laipsnių prieš laikrodžio rodyklę nuo pagrindinės diagramos orientacijos
                return (d.angle - 90) * Math.PI / 180 + Math.PI / 2;
            })
            .radius(d => (userSkillRatings[d.title] * 20 + innerRadius)); // Naudojame vartotojo įvertinimą

        // Nupiešiame personalizuotą diagramą
        g.append("path")
            .datum(ratedSkills)
            .attr("class", "personal-diagram-path")
            .attr("fill", "none")
            .attr("stroke", "#8B5CF6") // Ryškiai purpurinė spalva
            .attr("stroke-width", 3)
            .attr("stroke-linejoin", "round")
            .attr("d", lineGenerator);
    }

    // Funkcija informacijos rodymui (individualaus įgūdžio)
    function showInfo(d) {
        d3.select("#categoriesView").classed("hidden", true);
        d3.select("#skillsView").classed("hidden", true); // Paslėpiame abu perjungiamus vaizdus

        d3.select("#info-panel").html(`
            <div class="info-panel-content">
                <h2 class="text-xl font-bold mb-2 text-gray-900">${d.title}</h2>
                <p class="text-gray-700"><strong>Kategorija:</strong> <span style="color: ${categoryColors[d.category] || '#666'};">${d.category}</span></p>
                <p class="text-gray-700"><strong>Laipsnis:</strong> ${d.angle}°</p>
                <p class="text-gray-700"><strong>Sudėtingumas:</strong> ${d.level}</p>
                <p class="text-gray-700"><strong>Jūsų įvertinimas:</strong> <span class="font-semibold text-purple-600">${userSkillRatings[d.title]}</span></p>
                <p class="text-gray-700"><strong>Greiti patarimai:</strong> ${d.tips.join(", ")}</p>
                <p class="text-gray-700"><strong>Profesijos:</strong> ${d.professions.join(", ")}</p>
                <p class="text-gray-700"><strong>Patarimai vaikams:</strong> ${d.kids.join(", ")}</p>
                <button id="backToMainViewBtn" class="mt-4 px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors">
                    Grįžti
                </button>
            </div>
        `);

        d3.select("#backToMainViewBtn").on("click", () => {
            d3.select("#categoriesView").classed("hidden", false);
            d3.select("#skillsView").classed("hidden", true); // Rodo kategorijas
            displayCategoriesColumn(); // Vėl atvaizduoja kategorijas
            resetSearchFilter(); // Išvalome paieškos filtrą grįžtant į pagrindinį vaizdą
        });
    }

    // Funkcija JSON eksportavimui
    function exportToJson(skillRatings) {
        const filename = "mano_igudziai.json";
        const dataStr = JSON.stringify(skillRatings, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Eksportuota į JSON:", filename);
    }

    // Funkcija CSV eksportavimui
    function exportToCsv(allSkillsData, skillRatings) {
        const filename = "mano_igudziai.csv";
        let csvContent = "Įgūdis,Jūsų_Įvertinimas,Sudėtingumo_Lygis,36 Kryptys\n";

        const ratedSkills = allSkillsData.filter(skill => skillRatings[skill.title] > 0);

        if (ratedSkills.length > 0) {
            ratedSkills.forEach(skill => {
                const rating = skillRatings[skill.title];
                csvContent += `${JSON.stringify(skill.title)},${rating},${skill.level},${JSON.stringify(skill.category)}\n`;
            });
        } else {
            csvContent += "Nėra įvertintų įgūdžių.\n";
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Eksportuota į CSV:", filename);
    }

    // Funkcija HTML eksportavimui
    function exportToHtml(allSkillsData, skillRatings) {
        const filename = "mano_igudziai.html";
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="lt">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mano Įgūdžių Ataskaita</title>
                <style>
                    body { font-family: sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
                    .container { max-width: 800px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #eee; }
                    .no-data { text-align: center; color: #777; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Mano Įgūdžių Ataskaita</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Įgūdis</th>
                                <th>Jūsų Įvertinimas</th>
                                <th>Sudėtingumo Lygis (Max)</th>
                                <th>36 Kryptys</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        const ratedSkills = allSkillsData.filter(skill => skillRatings[skill.title] > 0);

        if (ratedSkills.length > 0) {
            ratedSkills.forEach(skill => {
                const rating = skillRatings[skill.title];
                htmlContent += `
                            <tr>
                                <td>${skill.title}</td>
                                <td>${rating}</td>
                                <td>${skill.level}</td>
                                <td>${skill.category}</td>
                            </tr>
                `;
            });
        } else {
            htmlContent += `<tr><td colspan="4" class="no-data">Nėra įvertintų įgūdžių.</td></tr>`;
        }

        htmlContent += `
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Eksportuota į HTML:", filename);
    }

    // Funkcija, kuri išvalo paieškos filtrą ir atkuria diagramos matomumą
    function resetSearchFilter() {
        d3.select("#searchInput").property("value", ""); // Išvalome paieškos laukelį
        // Atstatome visų SVG elementų matomumą
        g.selectAll(".bg-line, .bg-text, .bg-circle, .central-text, .personal-diagram-path, .skill-group").style("opacity", 1);
    }

    // Inicializuojame kategorijų rodymą
    displayCategoriesColumn();
    renderSkillRadioButtons(); // Generuojame RADIO mygtukus

    // Mygtukų funkcionalumas
    d3.select("#showCategoriesBtn").on("click", () => {
        d3.select("#categoriesView").classed("hidden", false);
        d3.select("#skillsView").classed("hidden", true);
        displayCategoriesColumn();
        resetSearchFilter(); // Išvalome paieškos filtrą, kai pereiname į kategorijas
    });

    d3.select("#showSkillsBtn").on("click", () => {
        d3.select("#categoriesView").classed("hidden", true);
        d3.select("#skillsView").classed("hidden", false);
        renderSkillRadioButtons(); // Pergeneruojame RADIO mygtukus (kartu su eksportavimo mygtukais)
        updatePersonalDiagram(); // Atnaujiname asmeninę diagramą, kai rodomi mygtukai
        resetSearchFilter(); // Išvalome paieškos filtrą, kai pereiname į įgūdžius
    });

    // Paieškos funkcionalumas
    const searchInput = d3.select("#searchInput");

    searchInput.on("keyup", function() {
        // Paieškos terminas: paverčiame mažosiomis raidėmis ir pašaliname diakritinius ženklus
        const searchTermRaw = this.value.toLowerCase();
        const searchTerm = searchTermRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Pritemdome visus fono elementus ir asmeninę diagramą, jei yra paieškos terminas
        g.selectAll(".bg-line, .bg-text, .bg-circle, .central-text, .personal-diagram-path").style("opacity", searchTermRaw ? 0.1 : 1);

        g.selectAll(".skill-group").each(function(d) {
            // Normalizuojame visus paieškai skirtus teksto laukus
            const titleNormalized = d.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const categoryNormalized = d.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const tipsNormalized = d.tips.map(tip => tip.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            const professionsNormalized = d.professions.map(prof => prof.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            const kidsNormalized = d.kids.map(kid => kid.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

            const match = titleNormalized.includes(searchTerm) ||
                          categoryNormalized.includes(searchTerm) ||
                          tipsNormalized.some(tip => tip.includes(searchTerm)) ||
                          professionsNormalized.some(prof => prof.includes(searchTerm)) ||
                          kidsNormalized.some(kid => kid.includes(searchTerm));
            
            // Nustatome matomumą pagal atitikimą paieškos terminui
            d3.select(this).style("opacity", searchTermRaw ? (match ? 1 : 0.1) : 1);
        });
    });
});
