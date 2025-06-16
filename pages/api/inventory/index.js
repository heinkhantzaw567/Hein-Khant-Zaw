import clientPromise from "../../../lib/mongodb";

// Category ID prefixes
const CATEGORY_PREFIXES = {
  'tshirt': '1000',
  'pants': '2000',
  'shoes': '3000',
  'accessories': '4000'
};

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("inventory");
  const collection = db.collection("inventories");
  const counterCollection = db.collection("counters");

  // Function to get next ID for a category
  async function getNextIdForCategory(category) {
    const prefix = CATEGORY_PREFIXES[category] || '1000';
    const result = await counterCollection.findOneAndUpdate(
      { _id: category },
      { $inc: { sequence_value: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    
    const sequenceNumber = result.value?.sequence_value || 1;
    return prefix + sequenceNumber.toString().padStart(4, '0');
  }

  // Function to check if name exists
  async function checkNameExists(nameMM) {
    const existingItem = await collection.findOne({ nameMM: nameMM });
    return existingItem !== null;
  }

  if (req.method === 'GET') {
    try {
      // Set headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Check if we only need to fetch categories
      if (req.query.onlyCategories === 'true') {
        const categories = await collection.distinct('category');
        return res.status(200).json({
          categories: categories.sort()
        });
      }
      
      const searchQuery = req.query.search || "";
      const categoryFilter = req.query.category || "";
      
      let query = {};
      
      if (searchQuery) {
        query = {
          nameMM: { $regex: searchQuery, $options: 'i' }
        };
      }

      if (categoryFilter) {
        query.category = categoryFilter;
      }

      console.log('Fetching inventory with query:', query);
      
      const inventory = await collection
        .find(query)
        .sort({ itemId: -1 })
        .toArray();

      console.log(`Found ${inventory.length} items in inventory`);

      // Only include categories in response if no specific category is requested
      const response = {
        items: inventory
      };

      if (!categoryFilter) {
        response.categories = await collection.distinct('category');
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: "Error fetching inventory" });
    }
  } 
  else if (req.method === 'POST') {
    try {
      const { nameMM, category, quantity, price } = req.body;
      
      // Validate required fields
      if (!nameMM || !category || quantity === undefined || price === undefined) {
        return res.status(400).json({ 
          error: "Burmese name, category, quantity, and price are required" 
        });
      }

      // Check if name already exists
      const nameExists = await checkNameExists(nameMM);
      if (nameExists) {
        return res.status(400).json({
          error: "အမည်သည် database ထဲတွင်ရှိပြီးသားဖြစ်ပါသည်။"
        });
      }

      // Get next ID for the category
      const itemId = await getNextIdForCategory(category.toLowerCase());

      // Create new inventory item
      const newItem = {
        itemId,
        nameMM,
        category,
        quantity: Number(quantity),
        price: Number(price),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newItem);

      // Create a unique index on nameMM if it doesn't exist
      await collection.createIndex({ nameMM: 1 }, { unique: true });

      res.status(201).json({ ...newItem, _id: result.insertedId });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      if (error.code === 11000) { // MongoDB duplicate key error
        res.status(400).json({ error: "အမည်သည် database ထဲတွင်ရှိပြီးသားဖြစ်ပါသည်။" });
      } else {
        res.status(500).json({ error: "Error creating inventory item" });
      }
    }
  }
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const result = await collection.deleteOne({ itemId: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      res.status(500).json({ error: "Error deleting inventory item" });
    }
  }
  else if (req.method === 'PATCH') {
    try {
      const { itemId, quantity } = req.body;
      
      if (!itemId || quantity === undefined) {
        return res.status(400).json({ error: "Item ID and quantity are required" });
      }

      // Validate quantity is a positive number
      const newQuantity = Number(quantity);
      if (isNaN(newQuantity) || newQuantity < 0) {
        return res.status(400).json({ error: "အရေအတွက်သည် အပေါင်းကိန်းဖြစ်ရမည်" });
      }

      const result = await collection.findOneAndUpdate(
        { itemId: itemId },
        { 
          $set: { 
            quantity: newQuantity,
            updatedAt: new Date()
          } 
        },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.status(200).json(result.value);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ error: "Error updating inventory item" });
    }
  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
