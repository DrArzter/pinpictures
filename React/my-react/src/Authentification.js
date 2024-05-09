import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import axios from 'axios';

function Authentification({ isLoggedIn, setIsLoggedIn, user, setUser }) {
    const userData = user && user.length > 0 ? user[0] : null;
    const [registration, setRegistration] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const hashPassword = (password) => {
        return CryptoJS.SHA256(password).toString();
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (registration) {
            await register();
        } else {
            await login();
        }
    };

    const register = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/users', {
                type: 'register',
                name: username,
                email: email,
                password: hashPassword(password)
            });
            const token = response.data.token;
            if (token) {
                localStorage.setItem('token', token);
                const userResponse = await axios.get('http://localhost:3000/api/users', {
                    headers: {
                        'Authorization': token
                    }
                })
                setUser(userResponse.data.data);
                redirectToMainPage(); 
            } else {
                console.error('Token not found in response');
            }
            setIsLoggedIn(true);
            setRegistration(false);
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error('Failed to register user', error);
            alert('Failed to register user');
        }
    }    
    
    const login = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/users', {
                type: 'login',
                name: username,
                password: hashPassword(password)
            });
            const token = response.data.token;
            if (token) {
                localStorage.setItem('token', token);
                const userResponse = await axios.get('http://localhost:3000/api/users', {
                    headers: {
                        'Authorization': token
                    }
                });
                setUser(userResponse.data.data);
                redirectToMainPage();
            } else {
                console.error('Token not found in response');
            }
            setIsLoggedIn(true);
            setRegistration(false);
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error('Invalid username or password', error);
            alert('Invalid username or password');
        }
    }    

    const redirectToMainPage = () => {
        navigate('/');
    };

    return (
        <div className="flex flex-col items-center bg-gray-600 h-screen text-gray-100 mx-auto p-4">
            <form className="w-full max-w-md" onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                {registration ? (
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <p className="text-red-500 text-xs italic">Please enter your email address.</p>
                    </div>
                ) : null}
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                    <input className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <p className="text-red-500 text-xs italic">Please enter your password.</p>
                </div>
                <div className="flex items-center justify-between">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">Submit</button>
                </div>
                <div className='my-4'></div>
                {registration ? (
                    <div className="flex items-center justify-between" onClick={() => setRegistration(false)}>
                        <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#" onClick={() => setRegistration(false)}>Already have an account? Sign In</a>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#" onClick={() => setRegistration(true)}>Don't have an account? Sign Up</a>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">Forgot Password?</a>
                </div>
            </form>
        </div>
    );
}

export default Authentification;
