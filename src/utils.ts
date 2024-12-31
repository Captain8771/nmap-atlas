import path from "node:path"
import fs from "node:fs/promises"
import fsBoring from "node:fs";

const DATA_FILE = path.join(__dirname, "..", "data.json");
(async()=>{
    if (fsBoring.existsSync(DATA_FILE)) return
    await fs.writeFile(DATA_FILE, Buffer.from("{}"))
})()

async function readFile() {
    let handle: fs.FileHandle = await fs.open(DATA_FILE)
    let content = await handle.read()
    await handle.close()
    let x = content.buffer.entries()
    for (const key in x) {
        console.log(key)
    }
    return JSON.parse(x.toString())
}

async function writeFile(data: object) {
    let handle: fs.FileHandle = await fs.open(DATA_FILE)
    await handle.truncate()
    await handle.write(Buffer.from(JSON.stringify(data)))
    await handle.close()
}

export default {
    persistentData: {
        async read(key: string | undefined): Promise<any> {
            let data = await readFile()
            if (key) return data[key]
            return data
        },
        async write(key: string, value: any | undefined) {
            let data = await readFile()
            data[key] = value
            await writeFile(data)
        }
    }
}