import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("inventory");
  const invoiceCollection = db.collection("invoices");
  const inventoryCollection = db.collection("inventories");

  if (req.method === 'POST') {
    try {
      const { customerName, items, totalAmount, date } = req.body;

      // Validate required fields
      if (!customerName || !items || items.length === 0) {
        return res.status(400).json({ 
          error: "Customer name and at least one item are required" 
        });
      }

      // Generate invoice number (INV-YYYYMMDD-XXX format)
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const lastInvoice = await invoiceCollection
        .find({ 
          invoiceNumber: { 
            $regex: `INV-${dateStr}-` 
          } 
        })
        .sort({ invoiceNumber: -1 })
        .limit(1)
        .toArray();

      let sequence = 1;
      if (lastInvoice.length > 0) {
        sequence = parseInt(lastInvoice[0].invoiceNumber.split('-')[2]) + 1;
      }
      const invoiceNumber = `INV-${dateStr}-${sequence.toString().padStart(3, '0')}`;

      // Update inventory quantities
      for (const item of items) {
        const inventory = await inventoryCollection.findOne({ itemId: item.itemId });
        if (!inventory) {
          throw new Error(`Item ${item.itemId} not found in inventory`);
        }
        if (inventory.quantity < item.quantity) {
          throw new Error(`Insufficient quantity for item ${item.nameMM}`);
        }

        await inventoryCollection.updateOne(
          { itemId: item.itemId },
          { 
            $inc: { quantity: -item.quantity },
            $set: { updatedAt: new Date() }
          }
        );
      }

      // Create new invoice
      const invoice = {
        invoiceNumber,
        customerName,
        items,
        totalAmount,
        date: date || today,
        createdAt: today,
        status: 'completed'
      };

      const result = await invoiceCollection.insertOne(invoice);
      res.status(201).json({ ...invoice, _id: result.insertedId });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: error.message });
    }
  }
  else if (req.method === 'GET') {
    try {
      const invoices = await invoiceCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: "Error fetching invoices" });
    }
  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
