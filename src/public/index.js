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
            final += `<div><b>${entry.ip}</b><br>`
            final += `<p>${entry.mac} (${entry.vendor})</p></div></br>`
        }
        outputContainer.innerHTML = final
    })
    ws.addEventListener("close", ev => {
        outputContainer.innerHTML = `<h1>Finished scanning.</h1><br>${outputContainer.innerHTML}`
    })

}