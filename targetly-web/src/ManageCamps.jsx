import React from 'react';

const ManageCamps = () => {
  const camps = [
    { name: 'Camp Everest', owner: 'John Doe', participants: 150 },
    { name: 'Beach Party Camp', owner: 'Jane Smith', participants: 87 },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Manage Camps</h2>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search camps..."
          className="px-4 py-2 border border-gray-300 rounded-md w-1/3"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          + Add New Camp
        </button>
      </div>
      <div className="space-y-4">
        {camps.map((camp, index) => (
          <div key={index} className="bg-white p-4 rounded-md shadow flex justify-between items-center">
            <div>
              <p className="font-semibold">{camp.name}</p>
              <p className="text-sm text-gray-500">Owner: {camp.owner}</p>
              <p className="text-sm text-gray-500">Participants: {camp.participants}</p>
            </div>
            <div className="space-x-2">
              <button className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Edit</button>
              <button className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCamps;

