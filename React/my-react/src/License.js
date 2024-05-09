import React from "react";

function License() {
    return (
        <div className="flex flex-col items-center bg-gray-600 h-screen text-gray-100 mx-auto p-4">
            <div className="w-1/2 bg-gray-800 p-6 rounded-lg">
                <h1 className="text-2xl font-bold mb-4">License</h1>
            </div>
            <div className="w-1/2 bg-gray-800 p-6 rounded-lg mt-4">
                <p className="mb-4">MIT License</p>
                <p className="mb-4">Copyright (c) 2024 Rostislaw Chapegma</p>
                <p className="mb-4">Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the "Software"), to deal
                in the Software without restriction, including without limitation the rights
                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is
                furnished to do so, subject to the following conditions:</p>
                <p className="mb-4">The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.</p>
                <p className="mb-4">THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.</p>
                </div>
        </div>
    );
}

export default License;