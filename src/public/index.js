function scan() {
    const outputContainer = document.getElementById("output")
    let ws = new WebSocket("/scan")
    ws.addEventListener("open", (ev) => {
        ws.send("!!OPEN")
    })
    let final = ""
    ws.addEventListener("message", ev => {
        let data = JSON.parse(ev.data)
        final = ""
        for (const entry of data) {
            final += `<div id="${entry.mac}"><b>${entry.note}</b> [${entry.ip}]<br>`
            final += `<p>${entry.mac} (${entry.vendor})</p>`
            final += `<input type="text" id="${entry.mac}-note" placeholder="Name the device">`
            final += `<button onclick="noteMAC('${entry.mac}')">Save name</button>`

            final += `</div></br>`
        }
    })
    ws.addEventListener("close", ev => {
        outputContainer.innerHTML = final
        outputContainer.innerHTML = `<h1>Finished scanning.</h1><br>${outputContainer.innerHTML}`
    })

}

function noteMAC(mac) {
    let note = document.getElementById(`${mac}-note`)
    fetch("/name", {
        method: "PUT",
        headers: {
            "atlas-key": mac,
            "atlas-value": note.value
        }
    })
}