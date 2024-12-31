function scan() {
    const outputContainer = document.getElementById("output")
    let ws = new WebSocket("/scan")
    ws.addEventListener("open", (ev) => {
        ws.send("!!OPEN")
    })
    ws.addEventListener("message", ev => {
        let data = JSON.parse(ev.data)
        let final = ""
        for (const entry of data) {
            final += `<div><h1>${entry.ip}</h1><br>`
            final += `<p>${entry.host} (${entry.vendor})</p></div></br>`
        }
        outputContainer.innerHTML = final
    })
}