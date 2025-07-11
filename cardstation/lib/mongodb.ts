import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/idcard"
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

try {
  if (process.env.MONGODB_URI) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
} catch (error) {
  console.warn("MongoDB connection failed, will use local storage:", error)
}

export default clientPromise