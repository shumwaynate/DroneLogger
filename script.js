//------------------------------------------------
// HARD CODED PASSWORDS
//------------------------------------------------
const FULL_ACCESS_PASSWORD = "1234";
const VIEW_ONLY_PASSWORD = "access";

//------------------------------------------------
// DROPDOWN OPTIONS — EDIT THESE ANY TIME
//------------------------------------------------
const DRONES = ["Security Drone", "DJI Mini 3", "DJI Air 3", "Warehouse Drone", "Other"];
const SITES  = ["Lot A", "Lot B", "Perimeter South", "Warehouse Roof", "Gate 2", "Other"];

//------------------------------------------------
// GOOGLE APPS SCRIPT ENDPOINT (FILL IN LATER)
//------------------------------------------------
let SHEET_URL = ""; // <-- You will paste your deployed Google Script URL here


//------------------------------------------------
// POPULATE DROPDOWNS
//------------------------------------------------
function populateDropdowns() {
    const d = document.getElementById("droneSelect");
    DRONES.forEach(x => d.add(new Option(x)));

    const s = document.getElementById("siteSelect");
    SITES.forEach(x => s.add(new Option(x)));
}


//------------------------------------------------
// LOGIN HANDLING
//------------------------------------------------
let viewOnly = false;

document.getElementById("loginBtn").addEventListener("click", () => {
    const entered = document.getElementById("loginPassword").value.trim();

    if (entered === FULL_ACCESS_PASSWORD) {
        viewOnly = false;
        unlockPage();
    }
    else if (entered === VIEW_ONLY_PASSWORD) {
        viewOnly = true;
        unlockPage();
    }
    else {
        document.getElementById("loginError").textContent = "Incorrect password.";
    }
});

function unlockPage() {
    document.getElementById("loginSection").classList.add("hidden");

    if (viewOnly) {
        document.getElementById("formSection").classList.add("hidden");
        document.getElementById("viewOnlyBanner").classList.remove("hidden");
    } else {
        document.getElementById("formSection").classList.remove("hidden");
    }

    document.getElementById("logSection").classList.remove("hidden");

    populateDropdowns();
    loadLogFromSheet();
}


//------------------------------------------------
// DURATION PARSER — defaults to minutes
//------------------------------------------------
function parseDuration(input) {
    input = input.toLowerCase().trim();

    // HH:MM format
    if (input.includes(":")) {
        let [h, m] = input.split(":").map(Number);
        return (h * 60 + m) * 60 * 1000;
    }

    // Hours + minutes (e.g., "1h30m")
    let hours = parseFloat(input.match(/([\d.]+)\s*h/)?.[1] || 0);
    let minutes = parseFloat(input.match(/([\d.]+)\s*m/)?.[1] || 0);

    if (hours || minutes) {
        return (hours * 60 + minutes) * 60 * 1000;
    }

    // "2 hours"
    if (input.includes("hour")) {
        let num = parseFloat(input);
        return num * 60 * 60 * 1000;
    }

    // Raw number → assume minutes
    let raw = parseFloat(input);
    if (!isNaN(raw)) {
        return raw * 60 * 1000;
    }

    return null;
}


//------------------------------------------------
// SUBMIT ENTRY
//------------------------------------------------
document.getElementById("submitBtn")?.addEventListener("click", submitEntry);

async function submitEntry() {
    if (!SHEET_URL) {
        alert("ERROR: Google Sheet URL not set yet.");
        return;
    }

    const drone   = document.getElementById("droneSelect").value;
    const site    = document.getElementById("siteSelect").value;
    const durationText = document.getElementById("durationInput").value;
    const comments = document.getElementById("commentsInput").value;

    let durationMs = parseDuration(durationText);
    if (!durationMs) {
        alert("Unable to read time flown. Try '25', '1h30m', or '45 minutes'.");
        return;
    }

    let endTime = new Date();
    let startTime = new Date(endTime - durationMs);

    let row = {
        drone, site,
        duration: durationText,
        start: startTime.toLocaleString(),
        end: endTime.toLocaleString(),
        comments,
        timestamp: new Date().toISOString()
    };

    document.getElementById("submitStatus").textContent = "Sending...";

    await fetch(SHEET_URL, {
        method: "POST",
        body: JSON.stringify(row),
        headers: { "Content-Type": "application/json" }
    });

    document.getElementById("submitStatus").textContent = "Saved!";
    loadLogFromSheet();
}


//------------------------------------------------
// LOAD LOG FROM GOOGLE SHEET
//------------------------------------------------
async function loadLogFromSheet() {
    if (!SHEET_URL) return;

    let res = await fetch(SHEET_URL);
    let data = await res.json();

    const body = document.getElementById("logBody");
    body.innerHTML = "";

    data.forEach(entry => {
        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${entry.timestamp}</td>
            <td>${entry.drone}</td>
            <td>${entry.site}</td>
            <td>${entry.duration}</td>
            <td>${entry.start}</td>
            <td>${entry.end}</td>
            <td>${entry.comments}</td>
        `;

        body.appendChild(row);
    });
}
