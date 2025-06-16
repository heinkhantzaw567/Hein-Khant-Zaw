import { useState } from 'react';

export default function ItemSelector({
  inventory,
  categories,
  currentItem,
  setCurrentItem,
  onAddItem,
  error,
  onCategoryChange,
  isLoadingInventory
}) {
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Add Items</h2>
      <div className="space-y-3">
        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Filter by Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => {
              const newCategory = e.target.value;
              setSelectedCategory(newCategory);
              setCurrentItem(prev => ({ ...prev, itemId: '' }));
              onCategoryChange(newCategory);
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:grid sm:grid-cols-2 sm:gap-4 space-y-3 sm:space-y-0">
          {/* Item Selection */}
          <div>
            <label htmlFor="item" className="block text-sm font-medium text-gray-700">
              Select Item
            </label>
            <select
              id="item"
              value={currentItem.itemId}
              onChange={(e) => {
                const selectedValue = e.target.value;
                const selectedItem = inventory.find(item => item.itemId === selectedValue);
                setCurrentItem(prev => ({
                  ...prev,
                  itemId: selectedValue,
                  price: selectedItem ? selectedItem.price : 0
                }));
              }}
              disabled={!selectedCategory || isLoadingInventory}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">
                {!selectedCategory 
                  ? 'Select a category first'
                  : isLoadingInventory 
                    ? 'Loading items...' 
                    : 'Select an item'
                }
              </option>
              {!isLoadingInventory && inventory.map((item) => (
                <option key={item.itemId} value={item.itemId}>
                  {item.nameMM} - ${item.price} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
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
                disabled={!currentItem.itemId}
                className="flex-1 min-w-0 block w-full border border-gray-300 rounded-none rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={onAddItem}
                disabled={!currentItem.itemId || isLoadingInventory}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mt-2 p-2 rounded-md ${
            error.startsWith('Added')
              ? 'text-green-700 bg-green-100'
              : 'text-red-700 bg-red-100'
          }`}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
