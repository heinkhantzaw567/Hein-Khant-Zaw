import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const db = client.db();

export async function verifyUser(email, password) {
  const user = await db.collection("users").findOne({ email });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) return null;

  return { id: user._id.toString(), email: user.email };
}
