
import fs from "fs";
import cloudinary from "../config/cloudinaryConfig.js"; 
import { db } from "../config/firebase.js"; 
import { doc, getDoc } from "firebase/firestore"; 

const deleteCloudinaryFile = async (publicId, resourceType = "image") => {
  if (!publicId) {
    console.warn("No publicId provided for deletion");
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log("Old avatar deleted from Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("Error deleting old avatar from Cloudinary:", error);
  }
};

const unlinkTempFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        reject(err);  // Reject the promise if there is an error
      } else {
        console.log("Temporary file deleted successfully");
        resolve();  // Resolve the promise if the file is deleted successfully
      }
    });
  });
};


// Middleware to check admin role
const isAdmin = async (req, res, next) => {
    const { uid } = req.body; // Get the user ID from the request
  
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const userData = userDoc.data();
      if (userData.usertype !== "admin") {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
  
      next(); // User is admin, proceed
    } catch (error) {
      console.error("Authorization Error:", error);
      res.status(500).json({ message: "Authorization Error", error: error.message });
    }
  };
  

export { deleteCloudinaryFile, unlinkTempFile, isAdmin };