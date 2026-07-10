\# InstaClone Backend



A full-stack Instagram clone backend built with Node.js, Express, and MongoDB.



\## Tech Stack

\- Runtime: Node.js / Express.js

\- Database: MongoDB (Mongoose)

\- Authentication: JWT

\- Image Upload: Cloudinary + Multer

\- Real-time: Socket.io

\- Email: Resend API



\## Features

\- User authentication (signup, login with email or username, JWT-based)

\- Post creation with image upload

\- Dynamic feed of all posts

\- Like / Unlike posts with real-time count

\- Comment system (add, view, delete)

\- Follow / Unfollow users with followers/following list

\- Save / Bookmark posts

\- Edit profile (name, bio)

\- Real-time notifications (likes and comments) via Socket.io



\## Setup Instructions

1\. Clone the repo and install dependencies: git clone repo-url, cd backend, npm install

2\. Create a .env file with: MONGO\_URI, JWT\_SECRET, CLOUDINARY\_CLOUD\_NAME, CLOUDINARY\_API\_KEY, CLOUDINARY\_API\_SECRET, RESEND\_API\_KEY, PORT=5000

3\. Run the server: npm run dev



\## API Endpoints

POST /api/auth/register - Register a new user

POST /api/auth/login - Login with email or username

POST /api/posts - Create a post

GET /api/posts - Get all posts (feed)

PUT /api/posts/:id/like - Like/unlike a post

POST /api/posts/:id/comment - Add a comment

DELETE /api/posts/:postId/comment/:commentId - Delete own comment

PUT /api/posts/:id/save - Save/unsave a post

GET /api/users/:id - Get user profile + posts

PUT /api/users/:id/follow - Follow/unfollow a user

GET /api/users/:id/followers - Get followers list

GET /api/users/:id/following - Get following list

PUT /api/users/me/update - Edit profile

GET /api/users/me/saved - Get saved posts

GET /api/users/me/notifications - Get notifications



\## Live Deployment

Backend is deployed on Render: https://instaclone-backend-1uxz.onrender.com

