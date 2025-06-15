import { hash } from "bcrypt";
import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

  const client = await clientPromise;
  const db = client.db();
  const existingUser = await db.collection("users").findOne({ email });

  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await hash(password, 10);
  await db.collection("users").insertOne({ 
    name, 
    email, 
    hashedPassword,
    createdAt: new Date()
  });

  res.status(201).json({ message: "User created" });
}
