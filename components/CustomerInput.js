import { useState } from 'react';

export default function CustomerInput({ customerName, setCustomerName }) {
  return (
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
  );
}
