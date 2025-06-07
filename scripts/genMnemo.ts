import { mnemonicNew } from "@ton/crypto"
import { writeFileSync } from "fs";

export async function generateMnemo() {
    let mnemo = await mnemonicNew()
    writeFileSync("secret.txt", mnemo.toString())
} 

(async () => {
    await generateMnemo(); 
})()