
import { db } from "../config/firebase.js"; 
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import cloudinary from "../config/cloudinaryConfig.js";
import { deleteCloudinaryFile, unlinkTempFile } from "../utils/helper.js"; // Adjust the path as necessary
import bcrypt from "bcrypt";

 
const getProfileById = async (req, res) => {
    const { userId } = req.params; // Assuming email is passed as a query parameter
  
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
  
    try {
      // Fetch the user document from Firestore using the email
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Destructure user data from Firestore
      const { firstname, lastname, avatar, username, email,usertype } = userDoc.data();
  
      // Respond with the user data
      res.status(200).json({
        email,
        firstname,
        lastname,
        avatar,
        username,
        usertype
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while fetching user data." });
    }
  };
  
  
  
  // Update user data
const updateProfileById = async (req, res) => {
    const { userId, firstname, lastname, password } = req.body;
    const avatar = req.files?.avatar;
  
    try {
      // Get user document from Firestore using email
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);    
  
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found." });
      }
  
      const userData = userDoc.data();
  
      // Destructure existing user data with fallback values
      const { avatar:currentAvatar = "", firstname:currentFirstname = "", lastname:currentLastname = "" } = userData;
  
      // If avatar is provided, upload it
      let avatarUrl = currentAvatar;
      let currentAvatarFilePublicId=null;
      let avatarFilePublicId=null;
      if (avatar) {
        currentAvatarFilePublicId = userData.avatarFilePublicId || null;
        const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
          folder: "Blog Web-App/usersProfileImage"
        });
        avatarUrl = result.secure_url;
        avatarFilePublicId = result.public_id;
  
        // Asynchronously delete the temp file
        await unlinkTempFile(avatar.tempFilePath);
      }
  
        const updatedData = {
            firstname: firstname || currentFirstname,
            lastname: lastname || currentLastname,
            avatar: avatarUrl,
            avatarFilePublicId,
            updated_at: new Date().toISOString(),
        };
        
        // If password is provided, hash and include it
        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }
        
        // Update user document
        await updateDoc(userDocRef, updatedData);
  
  
      // Delete the old avatar from Cloudinary using the function
      if (currentAvatarFilePublicId) {
        await deleteCloudinaryFile(currentAvatarFilePublicId);
      }
  
      res.status(200).json({ message: "Profile updated successfully.",userAvatarUrl :avatarUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while updating the profile." });
    }
  };


export { getProfileById, updateProfileById };
  
  