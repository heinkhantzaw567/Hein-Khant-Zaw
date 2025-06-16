import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import CustomerInput from '../../components/CustomerInput';
import ItemSelector from '../../components/ItemSelector';
import SelectedItems from '../../components/SelectedItems';

export default function CreateInvoice() {
  const { user } = useAuth();
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentItem, setCurrentItem] = useState({ itemId: '', quantity: 1, price: 0 });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Load categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/inventory?onlyCategories=true');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories: ' + err.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Load inventory items when a category is selected
  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    setInventory([]); // Clear current inventory
    setCurrentItem({ itemId: '', quantity: 1, price: 0 }); // Reset current item

    if (!category) {
      return;
    }

    try {
      setLoadingInventory(true);
      setError('');
      
      const response = await fetch(`/api/inventory?category=${encodeURIComponent(category)}&${new Date().getTime()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch inventory');
      }

      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid inventory data received');
      }
      
      const itemsWithStock = data.items.filter(item => item.quantity > 0);
      setInventory(itemsWithStock);
    } catch (err) {
      setError('Failed to load inventory: ' + err.message);
      console.error('Error loading inventory:', err);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleAddItem = () => {
    setError('');
    
    if (!currentItem.itemId) {
      setError('Please select an item from the list');
      return;
    }
    
    const inventoryItem = inventory.find(item => String(item.itemId) === String(currentItem.itemId));
    if (!inventoryItem) {
      setError('Could not find the selected item in inventory');
      return;
    }

    const quantity = Number(currentItem.quantity);
    if (isNaN(quantity) || quantity < 1) {
      setError('Please enter a valid quantity');
      return;
    }

    if (quantity > inventoryItem.quantity) {
      setError(`Only ${inventoryItem.quantity} items available in stock`);
      return;
    }

    const existingItem = selectedItems.find(item => item.itemId === currentItem.itemId);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > inventoryItem.quantity) {
        setError(`Cannot add ${quantity} more. Only ${inventoryItem.quantity - existingItem.quantity} items available.`);
        return;
      }

      setSelectedItems(
        selectedItems.map(item =>
          item.itemId === currentItem.itemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      const newItem = {
        ...currentItem,
        nameMM: inventoryItem.nameMM,
        category: inventoryItem.category
      };
      setSelectedItems([...selectedItems, newItem]);
    }

    // Reset current item except for category
    setCurrentItem({ itemId: '', quantity: 1, price: 0 });
    setError('Added to invoice');
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName) {
      setError('Customer name is required');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          items: selectedItems,
          totalAmount: calculateTotal(),
          date: new Date()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const invoice = await response.json();
      router.push(`/invoices/${invoice.invoiceNumber}`);
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-2 sm:py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Create Invoice</h1>
          {error && (
            <div className={`mb-4 p-4 rounded-md ${
              error.startsWith('Added') 
                ? 'text-green-700 bg-green-100' 
                : 'text-red-700 bg-red-100'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Category Selector - New component */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Select Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Items */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Add Items</h2>
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div>
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700">
                    Select Item
                  </label>
                  <select
                    id="item"
                    value={currentItem.itemId}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const selectedItem = inventory.find(item => {
                        return item.itemId === selectedValue;
                      });
                      setCurrentItem(prev => {
                        const newState = { 
                          ...prev, 
                          itemId: selectedValue,
                          price: selectedItem ? selectedItem.price : 0
                        };
                        return newState;
                      });
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select an item</option>
                    {inventory.map((item) => {
                      return (
                        <option key={item.itemId} value={item.itemId}>
                          {item.nameMM} - ${item.price} (Stock: {item.quantity})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="flex-1 min-w-0 block w-full border border-gray-300 rounded-none rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!currentItem.itemId}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Selected Items</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  {/* Desktop Table - Hidden on mobile */}
                  <div className="hidden sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedItems.map((item) => (
                          <tr key={item.itemId}>
                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                              {item.nameMM}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                              ${item.price}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.itemId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 text-right">
                            Total Amount:
                          </td>
                          <td colSpan="2" className="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900">
                            ${calculateTotal().toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards - Shown only on mobile */}
                  <div className="sm:hidden divide-y divide-gray-200">
                    {selectedItems.map((item) => (
                      <div key={item.itemId} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-gray-900">{item.nameMM}</div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.itemId)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Quantity:</span>
                          <span>{item.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Price:</span>
                          <span>${item.price}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total:</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50">
                      <div className="flex justify-between font-medium">
                        <span>Total Amount:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
