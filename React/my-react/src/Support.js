import React from "react";

function Support() {
    return (
        <div className="flex flex-col items-center bg-gray-600 h-screen text-gray-100 mx-auto p-4">
            <div className="w-1/2 bg-gray-800 p-6 rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Support</h1>
            </div>
            <div className="w-1/2 bg-gray-800 p-6 rounded-lg mt-4">
                <p className="mb-4">If you have any questions or concerns, please contact me.</p>
                <p className="mb-4">Email: chapegarostislav@gmail.com</p>
                <p className="mb-4">Phone: +48731378107</p>
                <a href = "https://github.com/DrArzter" className="mb-4">GitHub</a>
            </div>
        </div>
    );
}

export default Support;