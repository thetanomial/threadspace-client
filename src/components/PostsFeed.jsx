import React, { useState, useEffect } from 'react';
import {
    Heart,
    MessageCircle,
    Share,
    MoreHorizontal,
    Globe,
    Users,
    Lock,
    Trash2,
    Edit,
    Trash2Icon,
    Crown
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';

const PostsFeed = ({ refreshTrigger }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const { user } = useAuthStore();

    // Privacy icons
    const privacyIcons = {
        public: Globe,
        friends: Users,
        private: Lock
    };

    // Load posts
    const loadPosts = async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const response = await apiService.getPosts(pageNum, 10);

            if (response.success) {
                const newPosts = response.data.posts;

                if (append) {
                    setPosts(prev => [...prev, ...newPosts]);
                } else {
                    setPosts(newPosts);
                }

                setHasMore(response.data.pagination.hasNextPage);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Load more posts
    const loadMore = () => {
        if (!loadingMore && hasMore) {
            loadPosts(page + 1, true);
        }
    };

    // Handle like/unlike
    const handleLike = async (postId) => {
        try {
            const response = await apiService.likePost(postId);

            if (response.success) {
                setPosts(prev => prev.map(post =>
                    post._id === postId
                        ? {
                            ...post,
                            isLiked: response.data.isLiked,
                            likesCount: response.data.likesCount
                        }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    // Handle comment submission
    const handleComment = async (postId, content) => {
        if (!content.trim()) return;

        try {
            const response = await apiService.addComment(postId, content);

            if (response.success) {
                setPosts(prev => prev.map(post =>
                    post._id === postId
                        ? {
                            ...post,
                            comments: [...(post.comments || []), response.data.comment],
                            commentsCount: response.data.commentsCount
                        }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    // Handle delete post
    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await apiService.deletePost(postId);

            if (response.success) {
                setPosts(prev => prev.filter(post => post._id !== postId));
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Load posts on mount and refresh trigger
    useEffect(() => {
        loadPosts();
    }, [refreshTrigger]);

    // Don't render if user is not loaded yet
    if (!user) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-4 bg-gray-300 rounded"></div>
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                        <div className="h-40 bg-gray-300 rounded mb-4"></div>
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-4">
                                <div className="h-8 bg-gray-300 rounded w-16"></div>
                                <div className="h-8 bg-gray-300 rounded w-16"></div>
                                <div className="h-8 bg-gray-300 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={() => loadPosts()}
                    className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600">No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                <>
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={user}
                            onLike={handleLike}
                            onComment={handleComment}
                            onDelete={handleDelete}
                            formatTime={formatTime}
                            privacyIcons={privacyIcons}
                        />
                    ))}

                    {hasMore && (
                        <div className="text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Individual Post Card Component with Premium Badge Support
const PostCard = ({
    post,
    currentUser,
    onLike,
    onComment,
    onDelete,
    formatTime,
    privacyIcons
}) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showActions, setShowActions] = useState(false);

    // Safety check for post and currentUser
    if (!post || !post.author || !currentUser) {
        return null;
    }

    const PrivacyIcon = privacyIcons[post.privacy] || Globe;
    const isOwner = post.author._id === currentUser._id;

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            onComment(post._id, commentText);
            setCommentText('');
        }
    };

    // Helper function to check if user is premium
    const isPremiumUser = (user) => {
        return user && (user.isPremium || user.subscriptionType === 'premium');
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Post Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                                {post.author.firstName?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900 flex items-center">
                                    {`${post.author.firstName || ''} ${post.author.lastName || ''}`}
                                    {isPremiumUser(post.author) && (
                                        <Crown className="w-4 h-4 text-yellow-500 ml-1" title="Premium Member" />
                                    )}
                                </h3>
                                <PrivacyIcon className="w-3 h-3 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="relative">
                            <button
                                onClick={() => setShowActions(!showActions)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-500" />
                            </button>

                            {showActions && (
                                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                                    <button
                                        onClick={() => {
                                            onDelete(post._id);
                                            setShowActions(false);
                                        }}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2Icon className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Post Content */}
                {post.content && (
                    <p className="mt-4 text-gray-700 whitespace-pre-wrap">{post.content}</p>
                )}

                {/* Post Location & Feeling */}
                {(post.location || post.feeling) && (
                    <div className="mt-2 text-sm text-gray-600">
                        {post.location && <span>📍 {post.location}</span>}
                        {post.location && post.feeling && <span className="mx-2">•</span>}
                        {post.feeling && <span>😊 {post.feeling}</span>}
                    </div>
                )}

                {/* Post Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
                <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' :
                        post.images.length === 2 ? 'grid-cols-2' :
                            post.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                    {post.images.map((image, index) => (
                        <div key={index} className={`relative ${post.images.length === 3 && index === 0 ? 'col-span-2' : ''
                            }`}>
                            <img
                                src={image.url}
                                alt={image.alt || 'Post image'}
                                className="w-full h-64 object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Post Actions */}
            <div className="px-6 py-4">
                {/* Like/Comment/Share counts */}
                {(post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            {post.likesCount > 0 && (
                                <span>{post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}</span>
                            )}
                            {post.commentsCount > 0 && (
                                <span>{post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}</span>
                            )}
                        </div>
                        {post.sharesCount > 0 && (
                            <span>{post.sharesCount} {post.sharesCount === 1 ? 'share' : 'shares'}</span>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => onLike(post._id)}
                            className={`flex items-center space-x-1 ${post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">Like</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">Comment</span>
                        </button>

                        <button className="flex items-center space-x-1 text-gray-600 hover:text-green-600">
                            <Share className="w-5 h-5" />
                            <span className="text-sm">Share</span>
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Existing Comments */}
                        {post.comments && post.comments.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {post.comments.map((comment) => (
                                    <div key={comment._id} className="flex space-x-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xs font-medium">
                                                {comment.user?.firstName?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-gray-100 rounded-lg px-3 py-2">
                                                <p className="font-medium text-sm text-gray-900 flex items-center">
                                                    {`${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`}
                                                    {isPremiumUser(comment.user) && (
                                                        <Crown className="w-3 h-3 text-yellow-500 ml-1" title="Premium Member" />
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-700">{comment.content}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(comment.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Comment Form */}
                        <form onSubmit={handleCommentSubmit} className="flex space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-medium">
                                    {currentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostsFeed;