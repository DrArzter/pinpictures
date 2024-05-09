import axios from "axios";
import React, { useState } from "react";

function Cart({ items, setCartItems, setPosts }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(null);

    const toggleDropdown = (itemId) => {
        setIsDropdownOpen((prevItem) => (prevItem === itemId ? null : itemId));
    };

    const stopPropagation = (event) => {
        event.stopPropagation();
    };

    const deleteItem = (itemId) => {
        const updatedItems = items.filter((item) => item.id !== itemId);
        setCartItems(updatedItems);
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const checkout = async () => {
        try {
            const response = await axios.post("http://localhost:3000/api/posts", {
                type: "checkout",
                items: items.map((item) => ({
                    id: item.id
                }))
            });
            console.log(response.data);
            setCartItems([]);

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col items-center bg-gray-600 h-screen text-gray-100 mx-auto p-4">
            <div className="w-1/2 bg-gray-800 p-6 rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Cart</h1>
                <p className="text-gray-400">Total cost: {items.reduce((acc, item) => acc + parseInt(item.cost), 0)}</p>
                <p className="text-gray-400">Number of items: {items.length}</p>
                <div className="mt-4 flex flex-grid gap-4">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4" onClick={checkout}>Checkout</button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4" onClick={clearCart}>Clear Cart</button>
                </div>
            </div>
            <div className="w-1/2 bg-gray-800 p-6 rounded-lg mt-4">
                <div id="cart-items">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <div key={item.id} className="mb-4" onClick={stopPropagation}>
                                <div
                                    className="cursor-pointer"
                                    onClick={() => toggleDropdown(item.id)}
                                >
                                    <h2 className="text-xl font-bold">{item.name}</h2>
                                    <p className="text-gray-300">{item.description}</p>
                                    <p className="text-gray-500">Cost: {item.cost}</p>
                                </div>
                                {isDropdownOpen === item.id && (
                                    <div className="absolute bg-white p-2 shadow-lg rounded-md" onClick={stopPropagation}>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No items in the cart</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Cart;
