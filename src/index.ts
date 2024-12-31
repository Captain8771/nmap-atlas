import { FastifyReply, FastifyRequest } from "fastify";
import fastify from "fastify";
import constants from "./constants";
// TODO: Migrate to non-sync.
import { exec } from "node:child_process";
import { WebSocket } from "ws";
import path from "path";
import utils from "./utils";


const server = fastify()
server.register(require("@fastify/websocket"));
server.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/', // optional: default '/'
  })

server.register(async function (fastify) {
    // @ts-expect-error
    fastify.get("/scan", { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
        socket.on("message", async message => {
            if (message.toString() != "!!OPEN") return
            let buffer = "";
            let reg = /Nmap scan report for ((?:\d{1,3}\.?){4})\nHost is up \(\d+\.\d+s latency\).\s?\nMAC Address: ((?:[A-Z0-9]{2}:?){6})\s\((.+)\)/gm
            let found_hosts: Host[] = []
            let existing_hosts: string[] = []

            console.log(`Connected to ${req.host}! running nmap!`)
            const cProcess = exec("sudo nmap -sn 192.168.1.1/24")
            cProcess.stdout?.on("data", async chunk => {
                reg.lastIndex = 0 // I HATE JS
                buffer = buffer + chunk.toString()
                found_hosts = []
                if (!reg.test(buffer)) {
                    console.log(buffer)
                    return
                }
                for (let segment of buffer.match(reg)!) {
                    reg.lastIndex = 0 // I HATE JS
                    console.log(segment)
                    let match = reg.exec(segment)!;
                    if (existing_hosts.filter(x => x == match[2]).length > 0) continue
                    existing_hosts.push(match[2])
                    let pData = await utils.persistentData.read(match[2])
                    let note: string;
                    if (pData) {
                        note = pData.note ?? "Unnamed"
                    } else {
                        note = "Unnamed"
                    }
                    found_hosts.push({
                        ip: match[1],
                        mac: match[2],
                        vendor: match[3],
                        note: note
                    })
                }
                socket.send(JSON.stringify(found_hosts))

            })
            cProcess.on("exit", () => socket.close())
        })
    })
})

server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-expect-error
    return reply.sendFile('index.html')
})

server.get("/*", async (req: FastifyRequest, rep: FastifyReply) => {
    // @ts-expect-error
    return rep.sendFile(req.url)
})

server.put("/name", async (req: FastifyRequest, rep: FastifyReply) => {
    let key = req.headers["atlas-key"]
    let value = req.headers["atlas-value"]
    if (!key || !value) return rep.status(400).send({error: true, message: "It appears you have made a rookie mistake, rookie! (atlas-key or atlas-value header missing)"})
    
    // @ts-ignore
    let data = await utils.persistentData.read(key)
    data.note = value
    // @ts-ignore
    await utils.persistentData.write(key, data)
})


server.listen({ host: "0.0.0.0", port: 8080 }, (err: Error | null, address: string) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})