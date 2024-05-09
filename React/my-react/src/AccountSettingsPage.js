import React, { useState, useEffect } from "react";

function AccountSettingsPage( {user} ) {  
  
  const userData = user && user.length > 0 ? user[0] : null;
  return (
    <div className="flex flex-col items-center bg-gray-600 h-screen text-gray-100 mx-auto p-4">
      <div className="w-1/2 bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Account Settings</h1> 
        {user && (
          <>
            <p className="mb-4">Name: {userData.name}</p>
            <p className="mb-4">Email: {userData.email}</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={() => {}}>Delete</button> <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Edit</button>
          </>
        )} 
      </div>
    </div>
  );
}

export default AccountSettingsPage;
