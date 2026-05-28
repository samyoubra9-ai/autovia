#!/usr/bin/env node
import webpush from "web-push"

const keys = webpush.generateVAPIDKeys()

console.log("")
console.log("# Coller dans autoecole/.env et Vercel (projet API Next.js)")
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:contact@autovia.space`)
console.log("")
