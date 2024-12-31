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
        socket.on("open", () => {
            const cProcess = exec("nmap 192.168.1.1/24")
            cProcess.stdout?.on("data", chunk => {
                socket.send(chunk.toString())
            })
            cProcess.on("exit", () => socket.close())
        })
    })
})

server.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
    const output = execSync("whoami");
    return output.toString();
})


server.listen({ port: 8080 }, (err: Error | null, address: string) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})