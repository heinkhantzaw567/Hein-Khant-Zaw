export default function SelectedItems({ items, onRemoveItem, calculateTotal }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Items</h3>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="hidden sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.itemId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.nameMM}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${(item.quantity * item.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.itemId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  Total Amount:
                </td>
                <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                  ${calculateTotal().toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="sm:hidden divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.itemId} className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{item.nameMM}</span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.itemId)}
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
                <span>${item.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal:</span>
                <span>${(item.quantity * item.price).toFixed(2)}</span>
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
  );
}
