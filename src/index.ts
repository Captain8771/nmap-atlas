import { FastifyReply, FastifyRequest } from "fastify";
import fastify from "fastify";
import constants from "./constants";
// TODO: Migrate to non-sync.
import { execSync, exec } from "node:child_process";
import { WebSocket } from "ws";

const server = fastify()
server.register(require("@fastify/websocket"));

server.register(async function (fastify) {
    // @ts-expect-error
    fastify.get("/scan", { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
        if (req.headers["atlas-key"] != constants.DEFAULT_AUTH_KEY) return
        socket.on("message", message => {
            if (message.toString() != "!!OPEN") return
            let buffer = "";
            let reg = /Nmap scan report for ((?:\d{1,3}\.?){4})\nHost is up \(\d+\.\d+s latency\).\s?\nMAC Address: ((?:[A-Z0-9]{2}:?){6})\s\((.+)\)/gm
            let found_hosts: Host[] = []

            console.log(`Connected to ${req.host}! running nmap!`)
            const cProcess = exec("nmap 192.168.1.1/24")
            cProcess.stdout?.on("data", chunk => {
                buffer = buffer + chunk.toString()
                found_hosts = []
                if (!reg.test(buffer)) return
                for (let match of reg.exec(buffer)!) {
                    console.log(JSON.stringify(match))
                    found_hosts.push({
                        ip: match[0],
                        mac: match[1],
                        vendor: match[2]
                    })
                }
                socket.send(JSON.stringify(found_hosts))

            })
            cProcess.on("exit", () => socket.close())
        })
    })
})

server.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
    const output = execSync("whoami");
    return output.toString();
})


server.listen({ host: "0.0.0.0", port: 8080 }, (err: Error | null, address: string) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})