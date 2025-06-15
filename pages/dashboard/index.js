import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth-context";

const CATEGORIES = [
  { id: 'tshirt', label: 'T-Shirt' },
  { id: 'pants', label: 'Pants' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' }
];

const SORT_TYPES = {
  NONE: 'none',
  ASC: 'asc',
  DESC: 'desc'
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: null,
    type: SORT_TYPES.NONE
  });
  const [newItem, setNewItem] = useState({
    nameMM: "",
    category: "",
    quantity: "",
    price: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/inventory?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`
        );
        if (!response.ok) throw new Error('Failed to fetch inventory');
        const data = await response.json();
        setInventory(data.items);
        setCategories(data.categories);
        setError("");
      } catch (err) {
        setError("Failed to load inventory");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchInventory();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  // Sorting function
  const handleSort = (field) => {
    let newSortType = SORT_TYPES.ASC;
    
    if (sortConfig.field === field) {
      if (sortConfig.type === SORT_TYPES.ASC) {
        newSortType = SORT_TYPES.DESC;
      } else if (sortConfig.type === SORT_TYPES.DESC) {
        newSortType = SORT_TYPES.NONE;
      }
    }

    setSortConfig({
      field,
      type: newSortType
    });
  };

  // Get sorted inventory
  const getSortedInventory = () => {
    if (sortConfig.type === SORT_TYPES.NONE) return inventory;

    return [...inventory].sort((a, b) => {
      if (sortConfig.field === 'quantity') {
        const aValue = Number(a.quantity);
        const bValue = Number(b.quantity);
        return sortConfig.type === SORT_TYPES.ASC ? aValue - bValue : bValue - aValue;
      }
      if (sortConfig.field === 'price') {
        const aValue = Number(a.price);
        const bValue = Number(b.price);
        return sortConfig.type === SORT_TYPES.ASC ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return (
        <svg className="w-4 h-4 ml-1 inline-block text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortConfig.type === SORT_TYPES.ASC) {
      return (
        <svg className="w-4 h-4 ml-1 inline-block text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    if (sortConfig.type === SORT_TYPES.DESC) {
      return (
        <svg className="w-4 h-4 ml-1 inline-block text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setFormError(""); // Clear previous form errors
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item');
      }
      
      setInventory(prev => [data, ...prev]); // Add new item at the beginning
      setNewItem({
        nameMM: "",
        category: "",
        quantity: "",
        price: ""
      });
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message);
      console.error(err);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeletingId(itemToDelete.itemId);
      const response = await fetch(`/api/inventory?id=${itemToDelete.itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setInventory(inventory.filter(item => item.itemId !== itemToDelete.itemId));
      setShowConfirmDelete(false);
      setItemToDelete(null);
    } catch (err) {
      setError("Failed to delete item");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmDelete(false);
    setItemToDelete(null);
  };

  const handleEditQuantity = (item) => {
    setEditingItem(item);
    setNewQuantity(item.quantity.toString());
  };

  const handleUpdateQuantity = async (e) => {
    e.preventDefault();
    
    try {
      setUpdatingId(editingItem.itemId);
      
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: editingItem.itemId,
          quantity: Number(newQuantity)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update quantity');
      }

      const updatedItem = await response.json();
      
      setInventory(inventory.map(item => 
        item.itemId === updatedItem.itemId ? updatedItem : item
      ));
      
      setEditingItem(null);
      setNewQuantity("");
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setNewQuantity("");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Inventory Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-4">
                {user.email} {user.user_metadata?.full_name && `(${user.user_metadata.full_name})`}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Search, Filter, and Add Item Row */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search Bar */}
              <div className="w-full sm:w-64">
                <label htmlFor="search" className="sr-only">
                  Search inventory
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by Burmese name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Item Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showAddForm ? 'Cancel' : 'Add New Item'}
            </button>
          </div>

          {/* Add Item Form */}
          {showAddForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <form onSubmit={handleAddItem} className="space-y-4">
                {formError && (
                  <div className="p-3 text-red-700 bg-red-100 rounded">
                    {formError}
                  </div>
                )}
                <div>
                  <label htmlFor="nameMM" className="block text-sm font-medium text-gray-700">အမည်</label>
                  <input
                    type="text"
                    id="nameMM"
                    value={newItem.nameMM}
                    onChange={(e) => {
                      setFormError(""); // Clear error when user types
                      setNewItem(prev => ({ ...prev, nameMM: e.target.value }));
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      id="price"
                      value={newItem.price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quantity Edit Modal */}
          {editingItem && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Update Quantity: {editingItem.nameMM}
                      </h3>
                      <div className="mt-4">
                        <form onSubmit={handleUpdateQuantity}>
                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                              New Quantity
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              id="quantity"
                              min="0"
                              required
                              value={newQuantity}
                              onChange={(e) => setNewQuantity(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                              type="submit"
                              disabled={updatingId === editingItem.itemId}
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                              {updatingId === editingItem.itemId ? 'Updating...' : 'Update'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showConfirmDelete && itemToDelete && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Confirm Delete
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete "{itemToDelete.nameMM}"? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                      onClick={handleDeleteConfirm}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      onClick={handleDeleteCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {error && (
              <div className="p-4 text-red-700 bg-red-100">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-500">Loading inventory...</p>
              </div>
            ) : inventory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? "No items found matching your search" : "No items in inventory"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        အမည်
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('quantity')}
                      >
                        <span className="flex items-center">
                          Quantity
                          {getSortIcon('quantity')}
                        </span>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('price')}
                      >
                        <span className="flex items-center">
                          Price
                          {getSortIcon('price')}
                        </span>
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSortedInventory().map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.itemId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nameMM}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {CATEGORIES.find(cat => cat.id === item.category)?.label || item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => handleEditQuantity(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClick(item)}
                            disabled={deletingId === item.itemId}
                            className={`text-red-600 hover:text-red-900 ${
                              deletingId === item.itemId ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {deletingId === item.itemId ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


