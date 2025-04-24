
import cloudinary from "../config/cloudinaryConfig.js";
import { db } from "../config/firebase.js"; // Adjust the path as necessary
import { collection, doc,query,where, setDoc, getDocs, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { unlinkTempFile, deleteCloudinaryFile } from "../utils/helper.js"; // Adjust the path as necessary



// Add Post Route
const addPost = async (req, res) => {
    const { title, category, content, isFeatured=false, authorID } = req.body;
    const thumbnail = req.files?.thumbnail;
  
    try {
      // Upload thumbnail to Cloudinary (if provided)
      let thumbnailURL = null;
      let thumbnailURLFilePublicId = null;
      if (thumbnail) {
        const result = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
          folder: "Blog Web-App/postsThumbnail"
        });
        thumbnailURL = result.secure_url;
        thumbnailURLFilePublicId = result.public_id;
        // Asynchronously delete the temp file
        await unlinkTempFile(thumbnail.tempFilePath);
      }
  
      // Generate a unique ID for the post
      const postId = doc(collection(db, "posts")).id;
  
      // Save post to Firestore
      await setDoc(doc(db, "posts", postId), {
        title,
        category,
        content,
        isFeatured: isFeatured === "true" , // Convert to boolean
        thumbnailURL,
        thumbnailURLFilePublicId,
        authorID,
        commentsCount: 0,
        likes: 0,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  
      res.status(201).json({ message: "Post added successfully", postId });
    } catch (error) {
      console.error("Error adding post:", error);
      res.status(500).json({ message: "Error adding post", error: error.message });
    }
  };
  
  
const getPublicPosts =  async (req, res) => {
    
    try {
      // Fetch posts
      const postsSnapshot = await getDocs(collection(db, "posts"));
      const posts = [];
  
      for (const postDoc of postsSnapshot.docs) {
        const post = { id: postDoc.id, ...postDoc.data() };
  
        // Fetch author details from users collection
        const authorRef = doc(db, "users", post.authorID);
        const authorDoc = await getDoc(authorRef);
  
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          post.authorName = `${authorData.firstname} ${authorData.lastname}`;
          post.authorAvatar = authorData.avatar || null;
          delete post.authorID; 
        } else {
          post.authorName = "Unknown Author";
          post.authorAvatar = null;
        }
  
        posts.push(post);
      }
  
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Error fetching posts" });
    }
  };
  
  // get posts by userId
const getPosts = async (req, res) => {
    const { uid } = req.query; // User ID sent from the frontend
  
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized: User ID not provided" });
    }
  
    try {
      // Fetch user details to check role
      const userRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userRef);
  
      if (!userSnapshot.exists() ) {
        return res.status(403).json({ message: "User not found" });
      }
  
      const user = userSnapshot.data();
      const isAdmin = user.usertype === "admin";   
  
      // Fetch posts
      const postsSnapshot = await getDocs(collection(db, "posts"));
      const posts = [];
  
      for (const postDoc of postsSnapshot.docs) {
        const post = { id: postDoc.id, ...postDoc.data() };
  
        // Filter posts: If not admin, only fetch user's own posts
        if (!isAdmin && post.authorID !== uid ) {
          continue;
        }
  
        // Fetch author details from users collection
        const authorRef = doc(db, "users", post.authorID);
        const authorDoc = await getDoc(authorRef);
  
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          post.authorName = `${authorData.firstname} ${authorData.lastname}`;
          post.authorAvatar = authorData.avatar || null;
        } else {
          post.authorName = "Unknown Author";
          post.authorAvatar = null;
        }
  
        posts.push(post);
      }
  
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Error fetching posts" });
    }
  };
  
  
const getPostById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const postDoc = await getDoc(doc(db, "posts", id));
      if (!postDoc.exists()) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const post = postDoc.data();
  
      // Fetch author details
      const authorDoc = await getDoc(doc(db, "users", post.authorID));
      if (authorDoc.exists()) {
        const authorData = authorDoc.data();
        post.authorName = `${authorData.firstname} ${authorData.lastname}`;
        post.authorAvatar = authorData.avatar || null;
      } else {
        post.authorName = "Unknown Author";
        post.authorAvatar = null;
      }
  
      res.status(200).json({ id: postDoc.id, ...post });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Error fetching post" });
    }
  };



// Route to fetch posts by category with author details
const getPostsByCategoryTitle =  async (req, res) => {
    const { category_title } = req.params;

    try {
        // Query posts collection for the specified category
        const postsQuery = query(collection(db, "posts"), where("category", "==", category_title));
        const postSnapshot = await getDocs(postsQuery);

        const posts = [];

        for (const postDoc of postSnapshot.docs) {
            const post = { id: postDoc.id, ...postDoc.data() };

            // Fetch author details from users collection
            const authorRef = doc(db, "users", post.authorID);
            const authorDoc = await getDoc(authorRef);

            if (authorDoc.exists()) {
                const authorData = authorDoc.data();
                post.authorName = `${authorData.firstname} ${authorData.lastname}`;
                post.authorAvatar = authorData.avatar || null;
            } else {
                post.authorName = "Unknown Author";
                post.authorAvatar = null;
            }

            // Remove sensitive data
            delete post.authorID;
            posts.push(post);
        }

        // Send posts with author details
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts by category:", error);
        res.status(500).json({ message: "Error fetching posts." });
    }
};


const deletePostById = async (req, res) => {
    const { id } = req.params;
    const { uid } = req.body; // User ID sent from the frontend
  
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized: User ID not provided" });
    }
  
    try {
      // Fetch the post
      const postRef = doc(db, "posts", id);
      const postSnapshot = await getDoc(postRef);
  
      if (!postSnapshot.exists()) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const post = postSnapshot.data();
  
      // Fetch the user's role
      const userRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userRef);
  
      if (!userSnapshot.exists()) {
        return res.status(403).json({ message: "User not found" });
      }
  
      const user = userSnapshot.data();
  
      // Authorization: Only the author or an admin can delete the post
      if (post.authorID !== uid && user.usertype !== "admin") {
        return res.status(403).json({ message: "You are not authorized to delete this post" });
      }
  
      // Delete the post
      await deleteDoc(postRef);
  
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post", error: error.message });
    }
  };
  
  
const updatePostById = async (req, res) => {
    const { id } = req.params;
    const { title, category, content, uid } = req.body;
    const thumbnail = req.files?.thumbnail;
  
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized: User ID not provided" });
    }
  
    try {
      // Fetch the current post data
      const postRef = doc(db, "posts", id);
      const postSnapshot = await getDoc(postRef);
  
      if (!postSnapshot.exists()) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const post = postSnapshot.data();
  
      // Fetch the user's role from Firestore
      const userRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userRef);
  
      if (!userSnapshot.exists()) {
        return res.status(403).json({ message: "User not found" });
      }
  
      const user = userSnapshot.data();
  
      // Authorization: Check if the user is the author or an admin
      if (post.authorID !== uid && user.usertype !== "admin") {
        return res.status(403).json({ message: "You are not authorized to update this post" });
      }
      
  
      const isFeatured = user.usertype === "admin" ? req.body.isFeatured 
                              : post.isFeatured ;
        
      // console.log('isFeatured',isFeatured);
      
      // Update post data
      const updatedData = {
        title,
        category,
        content,
        isFeatured: isFeatured === "true",
        updated_at: new Date().toISOString(),
      };
  
      // Handle thumbnail update
      let currentThumbnailFilePublicId=null;
      if (thumbnail) {
        currentThumbnailFilePublicId = post.thumbnailURLFilePublicId || null;
        const result = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
          folder: "Blog Web-App/postsThumbnail"
        });
        updatedData.thumbnailURL = result.secure_url;
        updatedData.thumbnailURLFilePublicId = result.public_id;
        // Asynchronously delete the temp file
        await unlinkTempFile(thumbnail.tempFilePath);
      }
  
      // Update post in Firestore
      await updateDoc(postRef, updatedData);
  
      // Delete the old avatar from Cloudinary using the function
      if (currentThumbnailFilePublicId) {
        await deleteCloudinaryFile(currentThumbnailFilePublicId);
      }
  
      res.status(200).json({ message: "Post updated successfully" });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post", error: error.message });
    }
  };


  export { addPost, getPosts, getPublicPosts, getPostById, getPostsByCategoryTitle, deletePostById, updatePostById };
  
  