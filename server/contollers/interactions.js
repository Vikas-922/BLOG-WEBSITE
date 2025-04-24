
import { db } from "../config/firebase.js";
import { collection,query,where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, increment } from "firebase/firestore";
import cloudinary from "../config/cloudinaryConfig.js";
import { deleteCloudinaryFile, unlinkTempFile } from "../utils/helper.js"; // Adjust the path as necessary
import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_AUDIO_SIZE } from "../file_size_limits.js";


// Add view to post
const increment_View_ByPostId = async (req, res) => {
    const postId = req.params.id;
    const { userId } = req.body;
  
    try {
        const interactionDocRef = doc(db, "postInteractions", postId);
  
        const interactionDoc = await getDoc(interactionDocRef);
        let interactionData;
        if (!interactionDoc.exists()) {
            // return res.status(404).json({ message: "Post not found" });
            await setDoc(interactionDocRef, { viewedBy: [], likedBy: [] });
            interactionData =  { viewedBy: [], likedBy: [] };
        }else {
          interactionData = interactionDoc.data();  // Get data if document exists
        }
  
        // interactionData = interactionDoc.data();
        const alreadyViewed = interactionData.viewedBy.includes(userId);
  
        if (alreadyViewed) {
            return res.status(403).json({ message: "You have already viewed this post" });
        }
  
        // Add view to interactions collection
        await updateDoc(interactionDocRef, {
            viewedBy: arrayUnion(userId),
        });
  
        // Update the post document with the new view count
        const views = interactionData.viewedBy.length + 1;
        
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            views,
        });
  
        res.json({views, message: "View recorded and post updated successfully" });
    } catch (error) {
        console.error("Error recording view:", error);
        res.status(500).json({ message: "Failed to record view" });
    }
  };
  
  
  // Add like to post
const increment_Like_ByPostId =  async (req, res) => {
    const postId = req.params.id;
    const { userId } = req.body;
  
    try {
        const interactionDocRef = doc(db, "postInteractions", postId);
  
        // Get the current interactions data
        const interactionDoc = await getDoc(interactionDocRef);
        if (!interactionDoc.exists()) {
            return res.status(404).json({ message: "Post not found" });
        }
  
        const interactionData = interactionDoc.data();
        const alreadyLiked = interactionData.likedBy.includes(userId);
  
        if (alreadyLiked) {
            return res.status(400).json({ message: "You have already liked this post" });
        }
  
        // Add like to interactions collection
        await updateDoc(interactionDocRef, {
            likedBy: arrayUnion(userId),
        });
  
        // Update the post document with the new like count
        const likes = interactionData.likedBy.length + 1;
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            likes,
        });
  
        res.json({ likes, message: "Like recorded and post updated successfully" });
    } catch (error) {
        console.error("Error recording like:", error);
        res.status(500).json({ message: "Failed to record like" });
    }
  };
  

  // Fetch comments for a specific post
const getCommentsByPostId = async (req, res) => {
    const postId = req.params.id;
  
    try {
      // Query the 'comments' collection for comments matching the postId
      const commentsQuery = query(collection(db, "comments"), where("postId", "==", postId));
      const querySnapshot = await getDocs(commentsQuery);
  
      if (querySnapshot.empty) {
        return res.status(404).json({ message: "No comments found." });
      }
  
      // Extract comment data from query results
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      res.status(200).json(comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  };
  
  
  // Add comment and update post collection
const addComment_updatePost_ByPostId =  async (req, res) => {
    const postId = req.params.id;
    const { userId, username, userAvatarUrl, commentText } = req.body;
    const file = req.files?.file; // Optional uploaded file (image/video)
  
    if (file) {
      const mimeType = file.mimetype;
      const maxSize = mimeType.startsWith('image/') ? MAX_IMAGE_SIZE 
                          : (mimeType.startsWith('video/') ? MAX_VIDEO_SIZE 
                          : mimeType.startsWith('audio/') ? MAX_AUDIO_SIZE
                          : 1);
      if (file.size > maxSize && maxSize > 0) {
          return res.status(400).json({ message: `File size exceeds the limit or unsupported\nImage<1.5MB\tVideo<15MB\tAudio<3MB` });
      }
    }
  
    try {
        let fileURL = null;
        let fileURLFilePublicId = null;
        let fileType = null;
        // Upload file to Cloudinary (if provided)
        if (file) {
            const result = await cloudinary.uploader.upload(file.tempFilePath, {
                resource_type: "auto", // Automatically detect file type (image or video or audio)
                folder: "Blog Web-App/commentFile",
            });
            fileURL = result.secure_url;
            fileURLFilePublicId = result.public_id;
            fileType = result.resource_type;
            // Asynchronously delete the temp file
            await unlinkTempFile(file.tempFilePath);
            // console.log(result);          
        }
  
         // Create the comment object
        const comment = {
          postId,
          userId,
          username,
          userAvatarUrl,
          text: commentText,
          fileURL: fileURL || null,
          fileURLFilePublicId,
          fileType,
          date: new Date().toISOString(),
        };
  
        const commentRef = doc(collection(db, "comments"));
        const postRef = doc(db, "posts", postId);
  
        await setDoc(commentRef, comment);
  
        await updateDoc(postRef, {
          commentsCount: increment(1),
        })
  
        res.status(201).json({ id: commentRef.id, ...comment });
    } catch (err) {
        console.error("Error handling comment:", err);
        res.status(500).json({ message: "Failed to handle comment" });
    }
  };

  
const deleteCommentById = async (req, res) => {
    const commentId = req.params.commentId;
    const { userId } = req.body;
  
    try {
      const commentRef = doc(db, "comments", commentId);
      const commentSnapshot = await getDoc(commentRef);
  
      if (commentSnapshot.exists()) {
        const commentData = commentSnapshot.data();
  
        // Verify that the user is authorized to delete this comment
        if (commentData.userId !== userId) {
          return res.status(403).json({ message: "Unauthorized: You can only delete your own comments." });
        }
  
        // Optionally delete file from Cloudinary      
        if (commentData.fileURLFilePublicId) {
          // const resource_type = commentData.fileType==='video'? 'video' : 'auto';
          await deleteCloudinaryFile(commentData.fileURLFilePublicId, commentData.fileType);
        }
  
        // Delete the comment
        await deleteDoc(commentRef);
  
        // Update the post's comments count
        const postRef = doc(db, "posts", commentData.postId);
        await updateDoc(postRef, {
          commentsCount: increment(-1),
        });
  
        return res.status(200).json({commentId, message: "Comment deleted successfully" });
      } else {
        return res.status(404).json({ message: "Comment not found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error deleting comment", error });
    }
  };
  

  export { increment_View_ByPostId, increment_Like_ByPostId, getCommentsByPostId, addComment_updatePost_ByPostId, deleteCommentById };