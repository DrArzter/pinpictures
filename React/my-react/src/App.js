import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import AccountSettingsPage from './AccountSettingsPage';
import Authentification from './Authentification';
import Support from './Support';
import Cart from './Cart';
import License from './License';
import StarRating from './StarRating';

function Header({ isDropdownOpen, setIsDropdownOpen, isLoggedIn, setIsLoggedIn, user, setUser }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsDropdownOpen]);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    setIsLoggedIn(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-gray-800 text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} className="h-8 mr-2" alt="Logo" />
          <Link to="/" className="font-bold text-xl text-gray-100">Sekungma Store</Link>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button type="button" onClick={toggleDropdown} className="inline-flex text-gray-200 justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-700 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none">
            {user ? user[0].name : 'My Account'}
            <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${isDropdownOpen ? 'block' : 'hidden'}`}>
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              {isLoggedIn ? (
                <Link to="/account-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">My Profile</Link>
              ) : (
                <Link to="/Authentification" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Authentification</Link>
              )}
              {isLoggedIn ? (
                <Link to="/Cart" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Cart</Link>
              ) : null}
              <Link to="/Support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Support</Link>
              <Link to="/License" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">License</Link>
              {isLoggedIn ? (
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem" onClick={logout}>Sign out</button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Main({ posts, addToCart, setPosts }) {
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    getPosts();
    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const handleSortByChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    sortPosts(newSortBy);
  };

  const sortPosts = (sortBy) => {
    let sortedPosts = [...posts];
    if (sortBy === 'id') {
      sortedPosts.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'name') {
      sortedPosts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
      sortedPosts.sort((a, b) => b.rating - a.rating);
    }
    setFilteredPosts(sortedPosts);
  };

  const getPosts = () => {
    axios.get('http://localhost:3000/api/posts')
      .then(response => {
        setPosts(response.data.data);
        setFilteredPosts(response.data.data);
      })
      .catch(error => {
        console.error('Failed to get posts', error);
      });
  }

  const handleSearch = () => {
    const filtered = posts.filter(post =>
      post.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }

  const toggleMenu = (postId) => {
    setFilteredPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, showMenu: !post.showMenu } : { ...post, showMenu: false }
      )
    );
  };

  const addToCartHandler = (postId, posts) => {
    console.log(`Add post with id ${postId} to cart`);
    addToCart(postId, posts);
  };

  const editPostHandler = (postId) => {
    console.log(`Edit post with id ${postId}`);
  };

  const deletePostHandler = (postId) => {
    console.log(`Delete post with id ${postId}`);
    axios.post('http://localhost:3000/api/posts', {
      type: "delete",
      id: postId
    })
      .then(response => {
        getPosts();
      })
      .catch(error => {
        console.error('Failed to delete post', error);
      });
  };

  const handleDocumentClick = (event) => {
    setFilteredPosts(prevPosts =>
      prevPosts.map(post => ({ ...post, showMenu: false }))
    );
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setPreviewImage(null);
    }
  };

  const addComment = (postId, comment) => {
    console.log(`Add comment to post with id ${postId}: ${comment}`);
    axios.post('http://localhost:3000/api/posts', {
      type: "addComment",
      id: postId,
      comment: comment
    })
      .then(response => {
        getPosts();
      })
      .catch(error => {
        console.error('Failed to add comment', error);
      });
  };

  const addPost = async (name, description, cost, image) => {
    const formData = new FormData();
    formData.append('type', 'create');
    formData.append('name', name);
    formData.append('description', description);
    formData.append('cost', cost);
    formData.append('image', image);

    console.log(formData);

    try {
      const response = await axios.post('http://localhost:3000/api/formdata/posts', formData, {
        headers: {
          'Authorization': localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Post added successfully', response);
      getPosts();
      document.getElementById('AddPost').classList.toggle('hidden');
    } catch (error) {
      console.error('Failed to add post', error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-600 text-gray-100 mx-auto p-4" onClick={handleDocumentClick}>
      <div className="w-full lg:w-1/2 bg-gray-800 p-6 rounded-lg">
        <div>
          <h1 className="text-2xl font-bold mb-4">Main Page</h1>
          <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => document.getElementById('AddPost').classList.toggle('hidden')}>Add Post</button>
          <select value={sortBy} onChange={handleSortByChange} className="bg-gray-700 text-white px-4 py-2 rounded-md ml-4">
            <option value="">Sort by...</option>
            <option value="id">Time added</option>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <p className="mt-4">Welcome to the main page. Here you can find all posts.</p>
        <p>Search by name or type:</p>
        <div className="mb-4"></div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search by name or type..."
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch} className="ml-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none">
            Search
          </button>
        </div>
      </div>
      <form className="w-full lg:w-1/2 bg-gray-800 p-6 rounded-lg mt-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden" id="AddPost" encType="multipart/form-data">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Description"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cost">Cost</label>
          <input
            type="number"
            id="cost"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Cost"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">Image</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Image"
          />
        </div>
        {previewImage && (
          <div className="mt-2">
            <img src={previewImage} alt="Preview" className="max-w-xs" />
          </div>
        )}
        <div className="mt-4 mb-4">
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-700 mr-2 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => addPost(document.getElementById('name').value, document.getElementById('description').value, document.getElementById('cost').value, document.getElementById('image').files[0])}
          >
            Submit
          </button>
          <button
            type="button"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => document.getElementById('AddPost').classList.toggle('hidden')}
          >
            Cancel
          </button>
        </div>
      </form>
      <div className="w-full lg:w-1/2 bg-gray-800 p-6 rounded-lg mt-4 flex flex-col justify-between gap-8">
        {filteredPosts.map(post => (
          <div key={post.id}>
            <div className="bg-gray-700 p-6 rounded-lg relative" onClick={(event) => stopPropagation(event)}>
              <div className="">
                {post.picpath && <img src={`http://localhost:3000/${post.picpath}`} alt="Post Image" className="mb-4 hover:transform hover:scale-110 transition duration-500 rounded-2xl" style={{ minWidth: '100%', minHeight: '100%' }} />}
                <div className='flex flex-row'>
                  <div className='flex flex-col w-1/3'>
                    <h2 className="text-xl font-bold" onClick={() => toggleMenu(post.id)}>{post.name}</h2>
                    {post.showMenu && (
                      <div className="absolute bg-white p-2 shadow-lg rounded-md z-[999]" onClick={(event) => stopPropagation(event)}>
                        <button onClick={() => addToCartHandler(post.id)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                          Add to Cart
                        </button>
                        <button onClick={() => editPostHandler(post.id)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                          Edit
                        </button>
                        <button onClick={() => deletePostHandler(post.id)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                          Delete
                        </button>
                      </div>
                    )}
                    <p className="text-gray-300">{post.description}</p>
                    <p className="text-gray-500">Cost: {post.cost}</p>
                    <StarRating rating={post.rating} postId={post.id} setPosts={setPosts} />
                    <p className="text-gray-500">Posted by: <span className="cursor-pointer">{post.author}</span></p>
                  </div>
                  <div className="ml-4 w-full">
                    Place for comments. Post ID: {post.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='h-40'></div>
    </div>
  );
}

function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
      setIsVisible(isBottom);
    }

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <footer className={`bg-gray-800 text-white py-4 text-center w-full fixed bottom-0 transition-all duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div>
        <div>
          <a href="https://github.com/DrArzter" className="text-white hover:text-gray-400">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      getUser();
    }
  }, []);

  const getUser = () => {
    axios.get('http://localhost:3000/api/users', {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    })
      .then(response => {
        setUser(response.data.data);
      })
      .catch(error => {
        console.error('Failed to get user', error);
      });
  }

  const addToCart = (postId) => {
    const itemToAdd = posts.find(post => post.id === postId);
    if (itemToAdd) {
      const existingItem = cartItems.find(item => item.id === postId);
      if (existingItem) {
        setCartItems(prevItems => prevItems.map(item => item.id === postId ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        setCartItems(prevItems => [...prevItems, { ...itemToAdd, quantity: 1 }]);
      }
    }
  };

  useEffect(() => {
    console.log("Updated cartItems:", cartItems);
  }, [cartItems]);

  return (
    <Router>
      <div>
        <Header
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          user={user}
          setUser={setUser}

        />
        <Routes>
          <Route path="/" element={<Main addToCart={addToCart} posts={posts} setPosts={setPosts} />} />
          <Route path="/Authentification" element={<Authentification isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} setUser={setUser} user={user} />} />
          <Route path="/account-settings" element={<AccountSettingsPage user={user} />} />
          <Route path="/support" element={<Support />} />
          <Route path="/cart" element={<Cart items={cartItems} setCartItems={setCartItems} setPosts={setPosts} />} />
          <Route path="/License" element={<License />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
