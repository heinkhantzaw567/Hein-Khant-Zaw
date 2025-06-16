import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { invoiceNumber } = req.query;

  try {
    // Validate invoice number format
    if (!invoiceNumber || typeof invoiceNumber !== 'string') {
      console.error('Invalid invoice number:', invoiceNumber);
      return res.status(400).json({ error: "Invalid invoice number format" });
    }

    console.log('Attempting to fetch invoice:', invoiceNumber);

    const client = await clientPromise;
    const db = client.db("inventory");
    const collection = db.collection("invoices");

    // Use exact match for invoice number
    const invoice = await collection.findOne({ 
      invoiceNumber: invoiceNumber.trim() 
    });

    if (!invoice) {
      console.log('Invoice not found:', invoiceNumber);
      return res.status(404).json({ error: "Invoice not found" });
    }

    console.log('Successfully found invoice:', invoice.invoiceNumber);
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: "Error fetching invoice" });
  }
}
