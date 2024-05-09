import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StarRating = ({ rating, postId, setPosts }) => {
    const MAX_STARS = 5;
    const [currentRating, setCurrentRating] = useState(rating);

    const updatePostRating = (postId, newRating) => {
        axios.patch(`http://localhost:3000/api/posts/`, {
            type: "updateRating",
            id: postId,
            rating: newRating
        })
            .then(response => {
                console.log('Post rating updated:', response.data.data);
                setCurrentRating(newRating);
                setPosts(prevPosts => prevPosts.map(post => post.id === postId ? { ...post, rating: newRating } : post));
            })
            .catch(error => {
                console.error('Failed to update post rating:', error);
            });
    };

    const handleStarClick = (index) => {
        const newRating = index + 1;
        updatePostRating(postId, newRating);
    };

    useEffect(() => {
        setCurrentRating(rating);
    }, [rating]);

    return (
        <div className="flex">
            {[...Array(MAX_STARS)].map((_, index) => (
                <svg
                    key={`star-${index}`}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 fill-current ${index < currentRating ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                    viewBox="0 0 20 20"
                    onClick={() => handleStarClick(index)}
                    style={{ cursor: 'pointer' }}
                >
                    <path d="M10 0L12.2451 6.36214H19.5108L13.8824 10.7057L16.1275 17.0679L10 13.4196L3.87252 17.0679L6.11765 10.7057L0.489201 6.36214H7.75492L10 0Z" />
                </svg>
            ))}
        </div>
    );
};

export default StarRating;
