
import cloudinary from "../config/cloudinaryConfig.js"; // Adjust the path as necessary
import { db } from "../config/firebase.js"; // Adjust the path as necessary
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import bcrypt from "bcrypt";
import { unlinkTempFile } from "../utils/helper.js"; // Adjust the path as necessary



// Sign-Up Route
const signUp =  async (req, res) => {
    const { firstname, lastname, username, email, password } = req.body;
    const avatar = req.files?.avatar;
  
    try {
      // Check if the username or email already exists
      const userQuery = query(collection(db, "users"), where("username", "==", username));
      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const [userSnapshot, emailSnapshot] = await Promise.all([getDocs(userQuery), getDocs(emailQuery)]);
  
      if (!userSnapshot.empty) return res.status(400).json({ message: "Username already taken" });
      if (!emailSnapshot.empty) return res.status(400).json({ message: "Email already registered" });
  
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Upload avatar to Cloudinary (if provided)
      let avatarURL = "https://res.cloudinary.com/denezzat5/image/upload/v1740628175/Blog%20Web-App/usersProfileImage/ely11zjq94fwxnk7ye08.jpg";
      let avatarFilePublicId = null;
      if (avatar) {
        const result = await cloudinary.uploader.upload(avatar.tempFilePath, {
          folder: "Blog Web-App/usersProfileImage"
        });
        avatarURL = result.secure_url;
        avatarFilePublicId = result.public_id;
        // Asynchronously delete the temp file
        await unlinkTempFile(avatar.tempFilePath);
      }
  
      // Save user to Firestore
      const userId = doc(collection(db, "users")).id;  // Auto-generate ID
      await setDoc(doc(db, "users", userId), {
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,  // Store the hashed password
        usertype: "author",
        avatar: avatarURL,
        avatarFilePublicId,
        created_at: new Date().toISOString(),
      });
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error during sign-up:", error);
      res.status(500).json({ message: "Error during sign-up", error: error.message });
    }
  };
  
  
  // Login Route
const login = async (req, res) => {
    const { usernameEmail, password } = req.body;
  
    try {
      // Query Firestore for username or email
      const usernameQuery = query(collection(db, "users"), where("username", "==", usernameEmail));
      const emailQuery = query(collection(db, "users"), where("email", "==", usernameEmail));
      
      const [usernameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(emailQuery),
      ]);
  
      if (usernameSnapshot.empty && emailSnapshot.empty) {
        return res.status(400).json({ message: "Username or email not found" });
      }
  
      // Get the user document
      const userDoc = usernameSnapshot.empty ? emailSnapshot.docs[0] : usernameSnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
  
      // Compare hashed password
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }
  
      // Extract user details
      const { email, username, avatar: userAvatarUrl, usertype } = userData;
      const dashboardPage = usertype === "admin" ? "admin_Dashboardd.html" : "dashboard.html";
  
      // Return success response
      res.status(200).json({
        message: "Login successful",
        user: {
          uid: userId,  // Firestore document ID as UID
          email,
          username,
          userAvatarUrl,
          dashboardPage,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Error during login", error: error.message });
    }
  };
  

  export { signUp, login };