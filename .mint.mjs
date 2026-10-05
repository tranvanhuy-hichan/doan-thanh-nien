import { SignJWT } from "jose"; import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env","utf8").split("\n").filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/g,"")]}));
console.log(await new SignJWT({}).setProtectedHeader({alg:"HS256"}).setSubject(process.argv[2]).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(env.AUTH_SECRET)));
