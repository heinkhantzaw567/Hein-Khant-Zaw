import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("inventory");
    const collection = db.collection("inventories");

    // Set cache control headers
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

    // Get all distinct categories
    const categories = await collection.distinct('category');
    
    // For each category, get the count of items with stock
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await collection.countDocuments({
          category,
          quantity: { $gt: 0 }
        });
        return {
          name: category,
          itemCount: count
        };
      })
    );

    // Sort categories by name
    categoriesWithCount.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: "Error fetching categories" });
  }
}
